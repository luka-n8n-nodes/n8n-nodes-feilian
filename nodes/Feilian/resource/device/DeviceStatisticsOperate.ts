import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const DeviceStatisticsOperate: ResourceOperations = {
	name: '获取设备大盘信息',
	value: 'device:statistics',
	order: 10,
	options: [
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
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/device/statistics',
		};
		if (options.timeout) requestOptions.timeout = options.timeout;

		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
};

export default DeviceStatisticsOperate;
