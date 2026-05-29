import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const RoleUpdateOperate: ResourceOperations = {
	name: '更新角色基本信息',
	value: 'role:update',
	order: 140,
	options: [
		{
			displayName: '角色 ID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
			description: '角色 ID，格式 or_xxx',
		},
		{
			displayName: '角色名称',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
			description: '角色的新名称',
		},
		{
			displayName: '角色描述',
			name: 'description',
			type: 'string',
			default: '',
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
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const id = this.getNodeParameter('id', index) as string;
		const name = this.getNodeParameter('name', index) as string;
		const description = this.getNodeParameter('description', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { id, name };
		if (description) {
			body.description = description;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/role/update',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default RoleUpdateOperate;
