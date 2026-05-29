import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { timeoutOption } from '../../../help/utils/sharedOptions';

const RoleListOperate: ResourceOperations = {
	name: '获取角色列表',
	value: 'role:list',
	order: 120,
	options: [
		{
			displayName: '查询字符串',
			name: 'query',
			type: 'string',
			default: '',
			description: '模糊搜索角色名称',
		},
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
		const query = this.getNodeParameter('query', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const qs: IDataObject = {};
		if (query) {
			qs.query = query;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/role/list',
			qs,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		const response = await RequestUtils.request.call(this, requestOptions);
		if (Array.isArray(response)) {
			return response as IDataObject[];
		}
		const responseData = response as { roles?: IDataObject[]; role_list?: IDataObject[] };
		return responseData.roles ?? responseData.role_list ?? [];
	},
};

export default RoleListOperate;
