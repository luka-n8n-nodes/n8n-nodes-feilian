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

const RoleMemberUpdateOperate: ResourceOperations = {
	name: '更新角色成员',
	value: 'role:member:update',
	order: 170,
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
			displayName: '用户 ID 列表',
			name: 'user_ids',
			type: 'string',
			default: '',
			description: '多个用户 ID 用英文逗号分隔，格式 ou_xxx',
		},
		{
			displayName: '生效开始时间',
			name: 'effective_time',
			type: 'number',
			typeOptions: {
				minValue: 0,
			},
			default: 0,
			description: 'Unix 时间戳（单位秒）。0 表示不传，默认从当前时间开始生效',
		},
		{
			displayName: '生效结束时间',
			name: 'expired_time',
			type: 'number',
			typeOptions: {
				minValue: 0,
			},
			default: 0,
			description: 'Unix 时间戳（单位秒）。0 表示永久有效',
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
		const userIdsRaw = this.getNodeParameter('user_ids', index, '') as string;
		const effective_time = this.getNodeParameter('effective_time', index, 0) as number;
		const expired_time = this.getNodeParameter('expired_time', index, 0) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { role_id };
		if (userIdsRaw) {
			body.user_ids = commaSeparatedToArray(userIdsRaw);
		}
		if (effective_time) {
			body.effective_time = effective_time;
		}
		body.expired_time = expired_time;

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/role/member/update',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default RoleMemberUpdateOperate;
