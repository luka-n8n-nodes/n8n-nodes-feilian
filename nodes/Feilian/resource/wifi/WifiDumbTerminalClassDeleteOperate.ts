import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

export default {
	name: '批量删除哑终端设备类型',
	value: 'wifi:dumb_terminal:class:delete',
	order: 80,
	options: [
		{
			displayName: '设备类型 ID 列表',
			name: 'ids',
			type: 'string',
			required: true,
			default: '',
			description: '多个 ID 用英文逗号分隔',
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
		const idsRaw = this.getNodeParameter('ids', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const ids = idsRaw
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		const body: IDataObject = { ids };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/wifi/dumb_terminal/class/delete',
			body,
		};
		if (options.timeout) requestOptions.timeout = options.timeout;
		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
} as ResourceOperations;
