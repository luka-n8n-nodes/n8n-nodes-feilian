import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
	sleep,
} from 'n8n-workflow';
import ResourceFactory from '../help/builder/ResourceFactory';
import { Credentials, OutputType } from '../help/type/enums';
import { OperationResult, OperationCallFunction } from '../help/type/IResource';
import { ICommonOptionsValue } from '../help/utils/sharedOptions';

const resourceBuilder = ResourceFactory.build(__dirname);

interface IBatchConfig {
	enabled: boolean;
	batchSize: number;
	batchInterval: number;
}

interface IMultipleOutputResponse {
	outputType: OutputType;
	outputData?: INodeExecutionData[][];
}

interface IRequestResult {
	itemIndex: number;
	result?: OperationResult;
	error?: Error;
}

function getBatchConfig(context: IExecuteFunctions): IBatchConfig {
	try {
		const options = context.getNodeParameter('options', 0, {}) as ICommonOptionsValue;
		const batchingEnabled = options?.batching?.batch !== undefined;
		const batchSize = options?.batching?.batch?.batchSize ?? 50;
		const batchInterval = options?.batching?.batch?.batchInterval ?? 0;

		return {
			enabled: batchingEnabled,
			batchSize: batchSize === 0 ? 1 : batchSize,
			batchInterval,
		};
	} catch {
		return { enabled: false, batchSize: 50, batchInterval: 0 };
	}
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

function getErrorStack(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.stack;
	}
	return undefined;
}

function isMultipleOutputResponse(response: OperationResult): response is IMultipleOutputResponse {
	return (
		response !== null &&
		typeof response === 'object' &&
		'outputType' in response &&
		(response as IMultipleOutputResponse).outputType !== undefined
	);
}

function processResponseData(
	context: IExecuteFunctions,
	responseData: OperationResult,
	itemIndex: number,
): { data: INodeExecutionData[] | null; multipleOutput?: INodeExecutionData[][] } {
	if (isMultipleOutputResponse(responseData)) {
		const { outputType, outputData } = responseData;
		if (outputType === OutputType.Multiple && outputData) {
			return { data: null, multipleOutput: outputData };
		}
		if (outputType === OutputType.None) {
			return { data: null };
		}
	}

	const executionData = context.helpers.constructExecutionMetaData(
		context.helpers.returnJsonArray(responseData as IDataObject),
		{ itemData: { item: itemIndex } },
	);

	return { data: executionData };
}

function createErrorData(
	context: IExecuteFunctions,
	error: unknown,
	itemIndex: number,
): INodeExecutionData[] {
	return context.helpers.constructExecutionMetaData(
		context.helpers.returnJsonArray({ error: getErrorMessage(error) }),
		{ itemData: { item: itemIndex } },
	);
}

async function executeSerial(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	callFunc: OperationCallFunction,
	resource: string,
	operation: string,
): Promise<INodeExecutionData[][]> {
	const returnData: INodeExecutionData[][] = [[]];

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		try {
			context.logger.debug('call function (serial)', { resource, operation, itemIndex });
			const responseData = await callFunc.call(context, itemIndex);
			const processed = processResponseData(context, responseData, itemIndex);

			if (processed.multipleOutput) {
				return processed.multipleOutput;
			}
			if (processed.data === null && !processed.multipleOutput) {
				return [];
			}
			if (processed.data) {
				returnData[0].push(...processed.data);
			}
		} catch (error) {
			context.logger.error('call function error (serial)', {
				resource,
				operation,
				itemIndex,
				errorMessage: getErrorMessage(error),
				stack: getErrorStack(error),
			});
			if (context.continueOnFail()) {
				returnData[0].push(...createErrorData(context, error, itemIndex));
				continue;
			}
			throw error;
		}
	}

	return returnData;
}

async function executeParallel(
	context: IExecuteFunctions,
	items: INodeExecutionData[],
	callFunc: OperationCallFunction,
	batchConfig: IBatchConfig,
	resource: string,
	operation: string,
): Promise<INodeExecutionData[][]> {
	const { batchSize, batchInterval } = batchConfig;
	const requestPromises: Promise<IRequestResult>[] = [];
	const returnData: INodeExecutionData[][] = [[]];

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		if (itemIndex > 0 && batchSize > 0 && batchInterval > 0) {
			if (itemIndex % batchSize === 0) {
				await sleep(batchInterval);
			}
		}

		context.logger.debug('call function (parallel)', {
			resource,
			operation,
			itemIndex,
			batch: batchSize > 0 ? Math.floor(itemIndex / batchSize) : 0,
		});

		const requestPromise = callFunc
			.call(context, itemIndex)
			.then((result): IRequestResult => ({ itemIndex, result }))
			.catch((error): IRequestResult => ({ itemIndex, error: error as Error }));

		requestPromises.push(requestPromise);
	}

	const promisesResponses = await Promise.allSettled(requestPromises);

	for (let i = 0; i < promisesResponses.length; i++) {
		const response = promisesResponses[i];

		if (response.status === 'rejected') {
			const error = response.reason as Error;
			context.logger.error('call function error (parallel - rejected)', {
				resource,
				operation,
				itemIndex: i,
				errorMessage: getErrorMessage(error),
			});
			if (context.continueOnFail()) {
				returnData[0].push(...createErrorData(context, error, i));
				continue;
			}
			throw error;
		}

		const { itemIndex, result, error } = response.value;

		if (error) {
			context.logger.error('call function error (parallel)', {
				resource,
				operation,
				itemIndex,
				errorMessage: error.message,
				stack: error.stack,
			});
			if (context.continueOnFail()) {
				returnData[0].push(...createErrorData(context, error, itemIndex));
				continue;
			}
			throw error;
		}

		if (result === undefined) {
			continue;
		}

		const processed = processResponseData(context, result, itemIndex);
		if (processed.multipleOutput) {
			return processed.multipleOutput;
		}
		if (processed.data === null && !processed.multipleOutput) {
			continue;
		}
		if (processed.data) {
			returnData[0].push(...processed.data);
		}
	}

	return returnData;
}

export class Feilian implements INodeType {
	description: INodeTypeDescription = {
		displayName: '飞连',
		name: 'feilian',
		subtitle: '={{ $parameter.resource }}:{{ $parameter.operation }}',
		icon: 'file:feilian.svg',
		group: ['transform'],
		version: [1],
		defaultVersion: 1,
		description: '飞连开放平台 API 集成，支持部门与成员、Wi-Fi、终端管理',
		defaults: {
			name: '飞连',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: Credentials.FeilianApi,
				displayName: '飞连 API 凭证',
				required: true,
			},
		],
		properties: [
			...resourceBuilder.build(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const callFunc = resourceBuilder.getCall(resource, operation);

		if (!callFunc) {
			throw new NodeOperationError(this.getNode(), `未实现方法: ${resource}.${operation}`);
		}

		const batchConfig = getBatchConfig(this);

		if (batchConfig.enabled) {
			return executeParallel(this, items, callFunc, batchConfig, resource, operation);
		}

		return executeSerial(this, items, callFunc, resource, operation);
	}
}
