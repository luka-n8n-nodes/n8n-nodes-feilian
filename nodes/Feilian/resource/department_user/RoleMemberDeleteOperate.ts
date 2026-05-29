import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

function commaSeparatedToArray(value: string): string[] {
	return value
		.split(',')
		.map((item: string) => item.trim())
		.filter((item: string) => item);
}

const RoleMemberDeleteOperate: ResourceOperations = {
	name: '删除角色成员',
	value: 'role:member:delete',
	order: 180,
	options: [
		{
			displayName: '角色 ID',
			name: 'role_id',
			type: 'string',
			required: true,
			default: '',
			description: '角色 ID，格式 or_xxx',
		},
		{
			displayName: '部门 ID 列表',
			name: 'department_ids',
			type: 'string',
			default: '',
			description: '多个部门 ID 用英文逗号分隔，格式 od_xxx',
		},
		{
			displayName: '用户 ID 列表',
			name: 'user_ids',
			type: 'string',
			default: '',
			description: '多个用户 ID 用英文逗号分隔，格式 ou_xxx',
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
		const role_id = this.getNodeParameter('role_id', index) as string;
		const departmentIdsRaw = this.getNodeParameter('department_ids', index, '') as string;
		const userIdsRaw = this.getNodeParameter('user_ids', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { role_id };
		if (departmentIdsRaw) {
			body.department_ids = commaSeparatedToArray(departmentIdsRaw);
		}
		if (userIdsRaw) {
			body.user_ids = commaSeparatedToArray(userIdsRaw);
		}

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/role/member/delete',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default RoleMemberDeleteOperate;
