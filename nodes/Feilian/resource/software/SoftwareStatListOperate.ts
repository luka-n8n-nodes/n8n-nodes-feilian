import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const osOptions = [
	{ name: '全部', value: '' },
	{ name: 'Windows', value: 'windows' },
	{ name: 'Mac', value: 'mac' },
	{ name: 'Linux', value: 'linux' },
];

const SoftwareStatListOperate: ResourceOperations = {
	name: '软件列表',
	value: 'software:stat:list',
	order: 10,
	options: [
		{
			displayName: '软件 ID',
			name: 'sid',
			type: 'number',
			default: 0,
			description: '软件 ID（0 表示不传）',
		},
		{
			displayName: '软件名称',
			name: 'name',
			type: 'string',
			default: '',
		},
		{
			displayName: '操作系统',
			name: 'os',
			type: 'options',
			options: osOptions,
			default: '',
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
		const sid = this.getNodeParameter('sid', index, 0) as number;
		const name = this.getNodeParameter('name', index, '') as string;
		const os = this.getNodeParameter('os', index, '') as string;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {};
			if (sid) qs.sid = sid;
			if (name) qs.name = name;
			if (os) qs.os = os;
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
				url: '/api/open/v1/software/stat/list',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			if (Array.isArray(response)) {
				return { items: response as IDataObject[], count: response.length };
			}
			const responseData = response as {
				software_list?: IDataObject[];
				software?: IDataObject[];
				list?: IDataObject[];
				items?: IDataObject[];
				count?: number;
			};
			const items =
				responseData.software_list ??
				responseData.software ??
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

export default SoftwareStatListOperate;
