import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

export default {
	name: '查看员工的 Wi-Fi 启用状态',
	value: 'wifi:employee:status',
	order: 30,
	options: [
		{
			displayName: '用户 ID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
			description: '用户 ID（ou_xxx）',
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
		const id = this.getNodeParameter('id', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const qs: IDataObject = { id };
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/wifi/employee/status',
			qs,
		};
		if (options.timeout) requestOptions.timeout = options.timeout;
		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
} as ResourceOperations;
