import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const DepartmentGetListOperate: ResourceOperations = {
	name: '获取部门列表',
	value: 'department:list',
	order: 10,
	options: [
		{
			displayName: '部门 ID',
			name: 'id',
			type: 'string',
			default: '',
			description: '部门 ID，格式为 od_xxx。不填则获取全量组织架构',
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
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
		const id = this.getNodeParameter('id', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const qs: IDataObject = {};
		if (id) {
			qs.id = id;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/department/list',
			qs,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		const response = await RequestUtils.request.call(this, requestOptions);
		if (Array.isArray(response)) {
			return response as IDataObject[];
		}
		return [];
	},
};

export default DepartmentGetListOperate;
