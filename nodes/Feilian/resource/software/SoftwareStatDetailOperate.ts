import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const SoftwareStatDetailOperate: ResourceOperations = {
	name: '软件安装详情',
	value: 'software:stat:detail',
	order: 20,
	options: [
		{
			displayName: '软件 ID',
			name: 'sid',
			type: 'number',
			required: true,
			default: 0,
		},
		{
			displayName: '软件版本',
			name: 'version',
			type: 'string',
			default: '',
		},
		{
			displayName: '使用时长统计开始时间',
			name: 'usage_start',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳（秒），0 表示不传',
		},
		{
			displayName: '使用时长统计结束时间',
			name: 'usage_end',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳（秒），0 表示不传',
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
		const version = this.getNodeParameter('version', index, '') as string;
		const usage_start = this.getNodeParameter('usage_start', index, 0) as number;
		const usage_end = this.getNodeParameter('usage_end', index, 0) as number;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = { sid };
			if (version) qs.version = version;
			if (usage_start) qs.usage_start = usage_start;
			if (usage_end) qs.usage_end = usage_end;
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
				url: '/api/open/v1/software/stat/detail',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			if (Array.isArray(response)) {
				return { items: response as IDataObject[], count: response.length };
			}
			const responseData = response as {
				install_list?: IDataObject[];
				detail_list?: IDataObject[];
				list?: IDataObject[];
				items?: IDataObject[];
				count?: number;
			};
			const items =
				responseData.install_list ??
				responseData.detail_list ??
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

export default SoftwareStatDetailOperate;
