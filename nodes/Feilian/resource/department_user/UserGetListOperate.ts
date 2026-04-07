import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const UserGetListOperate: ResourceOperations = {
	name: '获取某个部门的成员',
	value: 'user:list',
	order: 30,
	options: [
		{
			displayName: '部门 ID',
			name: 'department_id',
			type: 'string',
			required: true,
			default: '',
			description: '部门 ID，格式 od_xxx',
		},
		{
			displayName: '递归子部门成员',
			name: 'fetch_child',
			type: 'boolean',
			default: false,
			description: '是否递归获取子部门成员',
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
		const department_id = this.getNodeParameter('department_id', index) as string;
		const fetchChild = this.getNodeParameter('fetch_child', index, false) as boolean;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const fetchPage = async (offset: number, pageSize: number) => {
			const qs: IDataObject = { department_id, offset, limit: pageSize };
			if (fetchChild) qs.fetch_child = fetchChild;
			const requestOptions: IHttpRequestOptions = {
				method: 'GET',
				url: '/api/open/v1/user/list',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			const responseData = response as { user_list?: IDataObject[]; count?: number };
			return { items: responseData.user_list || [], count: responseData.count || 0 };
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

export default UserGetListOperate;
