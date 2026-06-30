import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const SoftwareRecentlyUpdateOperate: ResourceOperations = {
	name: '获取终端上报软件列表',
	value: 'software:recently_update',
	order: 40,
	options: [
		{
			displayName: '开始时间',
			name: 'start_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳（秒），0 表示不传，默认当前时间前 1 小时',
		},
		{
			displayName: '结束时间',
			name: 'end_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳（秒），0 表示不传，默认当前时间',
		},
		paginationOptions.returnAll,
		paginationOptions.limit(200, 1, 20),
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
		const start_time = this.getNodeParameter('start_time', index, 0) as number;
		const end_time = this.getNodeParameter('end_time', index, 0) as number;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {};
			if (start_time) qs.start_time = start_time;
			if (end_time) qs.end_time = end_time;
			return qs;
		};

		const fetchPage = async (offset: number, pageSize: number) => {
			const qs: IDataObject = {
				...buildBaseQs(),
				offset,
				limit: pageSize,
			};
			const requestOptions: IHttpRequestOptions = {
				method: 'GET',
				url: '/api/open/v1/software/recently_update',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			if (Array.isArray(response)) {
				return { items: response as IDataObject[], count: response.length };
			}
			const responseData = response as {
				software_list?: IDataObject[];
				recently_update_list?: IDataObject[];
				list?: IDataObject[];
				items?: IDataObject[];
				count?: number;
			};
			const items =
				responseData.software_list ??
				responseData.recently_update_list ??
				responseData.list ??
				responseData.items ??
				[];
			return { items, count: responseData.count || 0 };
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

export default SoftwareRecentlyUpdateOperate;
