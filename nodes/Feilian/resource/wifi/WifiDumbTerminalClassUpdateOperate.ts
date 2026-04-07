import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

export default {
	name: '更新哑终端设备类型',
	value: 'wifi:dumb_terminal:class:update',
	order: 60,
	options: [
		{
			displayName: '设备类型记录 ID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: '新名称',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
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
		const name = this.getNodeParameter('name', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { id, name };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/wifi/dumb_terminal/class/update',
			body,
		};
		if (options.timeout) requestOptions.timeout = options.timeout;
		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
} as ResourceOperations;
