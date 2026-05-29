import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const RoleDeleteOperate: ResourceOperations = {
	name: '删除角色',
	value: 'role:delete',
	order: 150,
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
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/role/delete',
			body: { id },
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default RoleDeleteOperate;
