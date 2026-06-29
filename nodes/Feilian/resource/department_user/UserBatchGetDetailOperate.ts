import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

function normalizeStringArray(raw: unknown): string[] {
	if (raw === undefined || raw === null || raw === '') {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw.map((item) => String(item).trim()).filter((s) => s);
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (trimmed.startsWith('[')) {
			try {
				const parsed = JSON.parse(trimmed) as unknown;
				if (Array.isArray(parsed)) {
					return parsed.map((item) => String(item).trim()).filter((s) => s);
				}
			} catch {
				// fall through to comma-separated parsing
			}
		}
		return trimmed
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s);
	}
	return [String(raw).trim()].filter((s) => s);
}

const UserBatchGetDetailOperate: ResourceOperations = {
	name: '批量查询用户详情',
	value: 'user:batch',
	order: 70,
	options: [
		{
			displayName: 'IDs',
			name: 'ids',
			type: 'string',
			default: '',
			description:
				'用户 ID 列表，格式为 ou_xxx，最大长度不超过 50，与其他查询参数不能同时为空',
		},
		{
			displayName: 'Emails',
			name: 'emails',
			type: 'string',
			default: '',
			description: '邮箱列表，最大长度不超过 50，与其他查询参数不能同时为空',
		},
		{
			displayName: 'Mobiles',
			name: 'mobiles',
			type: 'string',
			default: '',
			description: '手机号列表，最大长度不超过 50，与其他查询参数不能同时为空',
		},
		{
			displayName: 'User IDs',
			name: 'user_ids',
			type: 'string',
			default: '',
			description: '自定义用户 ID 列表，最大长度不超过 50，与其他查询参数不能同时为空',
		},
		{
			displayName: 'Mode',
			name: 'mode',
			type: 'options',
			description: '查询模式，0:仅查询在职用户 1:查询全部用户，包括离职。 默认值 0',
			options: [
				{ name: '0 - 仅查询在职用户', value: 0 },
				{ name: '1 - 查询全部用户，包括离职', value: 1 },
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
		const ids = normalizeStringArray(this.getNodeParameter('ids', index, ''));
		const emails = normalizeStringArray(this.getNodeParameter('emails', index, ''));
		const mobiles = normalizeStringArray(this.getNodeParameter('mobiles', index, ''));
		const userIds = normalizeStringArray(this.getNodeParameter('user_ids', index, ''));
		const mode = this.getNodeParameter('mode', index, 0) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { mode };
		if (ids.length > 0) {
			body.ids = ids;
		}
		if (emails.length > 0) {
			body.emails = emails;
		}
		if (mobiles.length > 0) {
			body.mobiles = mobiles;
		}
		if (userIds.length > 0) {
			body.user_ids = userIds;
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
