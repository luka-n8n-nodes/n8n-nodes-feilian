import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const DeviceGetDetailOperate: ResourceOperations = {
	name: 'Did 换设备信息',
	value: 'device:detail',
	order: 20,
	options: [
		{
			displayName: '设备 Did',
			name: 'did',
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
		const did = this.getNodeParameter('did', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const qs: IDataObject = { did };
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/device/detail',
			qs,
		};
		if (options.timeout) requestOptions.timeout = options.timeout;

		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
};

export default DeviceGetDetailOperate;
