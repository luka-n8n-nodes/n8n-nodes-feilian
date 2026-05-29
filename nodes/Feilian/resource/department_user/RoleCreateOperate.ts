import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const RoleCreateOperate: ResourceOperations = {
	name: '创建角色',
	value: 'role:create',
	order: 110,
	options: [
		{
			displayName: '角色名称',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
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
		const name = this.getNodeParameter('name', index) as string;
		const description = this.getNodeParameter('description', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { name };
		if (description) {
			body.description = description;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/role/create',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default RoleCreateOperate;
