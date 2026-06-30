import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const directionOptions = [
	{ name: '升序', value: 'asc' },
	{ name: '降序', value: 'desc' },
];

const SoftwareStatUserUsageTimeListOperate: ResourceOperations = {
	name: '获取软件安装用户的使用时长',
	value: 'software:stat:user_usage_time:list',
	order: 30,
	options: [
		{
			displayName: '软件 ID',
			name: 'sid',
			type: 'number',
			required: true,
			default: 0,
		},
		{
			displayName: '员工 ID',
			name: 'user_id',
			type: 'string',
			default: '',
			description: '员工 ID，格式为 ou_xxx',
		},
		{
			displayName: '设备 ID',
			name: 'did',
			type: 'string',
			default: '',
		},
		{
			displayName: '使用时长统计开始时间',
			name: 'start_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳（秒），0 表示不传',
		},
		{
			displayName: '使用时长统计结束时间',
			name: 'end_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳（秒），0 表示不传',
		},
		{
			displayName: '排序方式',
			name: 'direction',
			type: 'options',
			options: directionOptions,
			default: 'desc',
			description: '结果数据排序方式，asc 升序，desc 降序',
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
		const sid = this.getNodeParameter('sid', index) as number;
		const user_id = this.getNodeParameter('user_id', index, '') as string;
		const did = this.getNodeParameter('did', index, '') as string;
		const start_time = this.getNodeParameter('start_time', index, 0) as number;
		const end_time = this.getNodeParameter('end_time', index, 0) as number;
		const direction = this.getNodeParameter('direction', index, 'desc') as string;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = { sid, direction };
			if (user_id) qs.user_id = user_id;
			if (did) qs.did = did;
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
				url: '/api/open/v1/software/stat/user_usage_time/list',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			if (Array.isArray(response)) {
				return { items: response as IDataObject[], count: response.length };
			}
			const responseData = response as {
				user_usage_time_list?: IDataObject[];
				usage_time_list?: IDataObject[];
				list?: IDataObject[];
				items?: IDataObject[];
				count?: number;
			};
			const items =
				responseData.user_usage_time_list ??
				responseData.usage_time_list ??
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

export default SoftwareStatUserUsageTimeListOperate;
