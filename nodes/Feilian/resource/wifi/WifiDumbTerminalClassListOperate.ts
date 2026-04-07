import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

export default {
	name: '获取哑终端设备类型列表',
	value: 'wifi:dumb_terminal:class:list',
	order: 70,
	options: [
		{
			displayName: '设备类型名称',
			name: 'name',
			type: 'string',
			default: '',
			description: '按名称筛选，留空表示不传',
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
		const name = this.getNodeParameter('name', index, '') as string;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {};
			if (name) qs.name = name;
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
				url: '/api/open/v1/wifi/dumb_terminal/class/list',
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
} as ResourceOperations;
