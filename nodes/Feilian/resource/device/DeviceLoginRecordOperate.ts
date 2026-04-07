import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const DeviceLoginRecordOperate: ResourceOperations = {
	name: '获取设备登陆日志',
	value: 'device:login_record',
	order: 40,
	options: [
		{
			displayName: '设备 did',
			name: 'did',
			type: 'string',
			required: true,
			default: '',
			description: '设备 did',
		},
		paginationOptions.returnAll,
		paginationOptions.limit(200),
		{
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add option',
			default: {},
			options: [timeoutOption],
		},
	] as INodeProperties[],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const did = this.getNodeParameter('did', index) as string;

		const fetchPage = async (offset: number, pageSize: number) => {
			const qs: IDataObject = { offset, limit: pageSize, did };
			const requestOptions: IHttpRequestOptions = {
				method: 'GET',
				url: '/api/open/v1/device/login_record',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			const responseData = response as { items?: IDataObject[]; count?: number };
			return { items: responseData.items || [], count: responseData.count || 0 };
		};

		if (returnAll) {
			let allResults: IDataObject[] = [];
			let offset = 0;
			const pageSize = 200;
			while (true) {
				const { items, count } = await fetchPage(offset, pageSize);
				allResults = allResults.concat(items);
				offset += items.length;
				if (offset >= count || items.length === 0) break;
			}
			return allResults;
		} else {
			const { items } = await fetchPage(0, limit);
			return items;
		}
	},
};

export default DeviceLoginRecordOperate;
