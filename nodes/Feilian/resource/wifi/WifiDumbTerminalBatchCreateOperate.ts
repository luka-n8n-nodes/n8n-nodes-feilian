import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

export default {
	name: '批量创建哑终端',
	value: 'wifi:terminal:create',
	order: 90,
	options: [
		{
			displayName: '哑终端列表 (JSON)',
			name: 'dumb_terminals',
			type: 'string',
			required: true,
			default: '[]',
			description:
				'JSON 数组。每项含 class_name、name、mac（必填）；description、user_id、validity_start_time、validity_end_time 可选',
		},
		{
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add option',
			default: {},
			options: [batchingOption, timeoutOption],
		},
	] as INodeProperties[],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const dumbTerminalsJson = this.getNodeParameter('dumb_terminals', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		let dumb_terminals: IDataObject[];
		try {
			const parsed = JSON.parse(dumbTerminalsJson) as unknown;
			if (!Array.isArray(parsed)) {
				throw new Error('dumb_terminals 必须是 JSON 数组');
			}
			dumb_terminals = parsed as IDataObject[];
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			throw new NodeOperationError(this.getNode(), `解析 dumb_terminals JSON 失败: ${msg}`);
		}
		const body: IDataObject = { dumb_terminals };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/wifi/terminal/create',
			body,
		};
		if (options.timeout) requestOptions.timeout = options.timeout;
		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
} as ResourceOperations;
