import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const UserBatchGetDetailOperate: ResourceOperations = {
	name: '批量查询用户详情',
	value: 'user:batch',
	order: 70,
	options: [
		{
			displayName: '用户 ID 列表',
			name: 'ids',
			type: 'string',
			default: '',
			description: '多个 ID 用英文逗号分隔',
		},
		{
			displayName: '邮箱列表',
			name: 'emails',
			type: 'string',
			default: '',
			description: '多个邮箱用英文逗号分隔',
		},
		{
			displayName: '手机列表',
			name: 'mobiles',
			type: 'string',
			default: '',
			description: '多个手机号用英文逗号分隔',
		},
		{
			displayName: 'User IDs',
			name: 'user_ids',
			type: 'string',
			default: '',
			description: '多个 user_id 用英文逗号分隔',
		},
		{
			displayName: '查询模式',
			name: 'mode',
			type: 'options',
			options: [
				{ name: '仅在职用户', value: 0 },
				{ name: '全部用户', value: 1 },
			],
			default: 0,
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
		const idsRaw = this.getNodeParameter('ids', index, '') as string;
		const emailsRaw = this.getNodeParameter('emails', index, '') as string;
		const mobilesRaw = this.getNodeParameter('mobiles', index, '') as string;
		const userIdsRaw = this.getNodeParameter('user_ids', index, '') as string;
		const mode = this.getNodeParameter('mode', index, 0) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { mode };
		if (idsRaw) {
			body.ids = idsRaw
				.split(',')
				.map((s: string) => s.trim())
				.filter((s: string) => s);
		}
		if (emailsRaw) {
			body.emails = emailsRaw
				.split(',')
				.map((s: string) => s.trim())
				.filter((s: string) => s);
		}
		if (mobilesRaw) {
			body.mobiles = mobilesRaw
				.split(',')
				.map((s: string) => s.trim())
				.filter((s: string) => s);
		}
		if (userIdsRaw) {
			body.user_ids = userIdsRaw
				.split(',')
				.map((s: string) => s.trim())
				.filter((s: string) => s);
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/user/batch',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		const response = (await RequestUtils.request.call(this, requestOptions)) as {
			users?: IDataObject[];
		};
		return response.users ?? [];
	},
};

export default UserBatchGetDetailOperate;
