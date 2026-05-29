import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const MAX_CONTACT_LIST_SIZE = 50;

function parseContactList(raw: unknown, fieldName: string, node: IExecuteFunctions): string[] {
	if (raw === undefined || raw === null || raw === '') {
		return [];
	}

	if (Array.isArray(raw)) {
		return raw
			.map((value) => String(value).trim())
			.filter((value) => value);
	}

	if (typeof raw !== 'string') {
		throw new NodeOperationError(node.getNode(), `${fieldName}必须是字符串或数组`);
	}

	const value = raw.trim();
	if (!value) {
		return [];
	}

	if (value.startsWith('[')) {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (!Array.isArray(parsed)) {
				throw new Error(`${fieldName}必须是数组`);
			}
			return parsed
				.map((item) => String(item).trim())
				.filter((item) => item);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(node.getNode(), `解析${fieldName}失败: ${message}`);
		}
	}

	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item);
}

function validateContactListSize(
	list: string[],
	fieldName: string,
	node: IExecuteFunctions,
): void {
	if (list.length > MAX_CONTACT_LIST_SIZE) {
		throw new NodeOperationError(
			node.getNode(),
			`${fieldName}最多支持 ${MAX_CONTACT_LIST_SIZE} 条数据`,
		);
	}
}

const UserBatchGetIdOperate: ResourceOperations = {
	name: '邮箱或手机批量获取用户 ID',
	value: 'user:batch_get_id',
	order: 60,
	options: [
		{
			displayName: '邮箱列表',
			name: 'emails',
			type: 'string',
			default: '',
			description: '邮箱列表，最多 50 条。支持英文逗号分隔、JSON 数组或表达式数组',
		},
		{
			displayName: '手机列表',
			name: 'mobiles',
			type: 'string',
			default: '',
			description: '手机号列表，最多 50 条。支持英文逗号分隔、JSON 数组或表达式数组',
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
		const emailsRaw = this.getNodeParameter('emails', index, '') as unknown;
		const mobilesRaw = this.getNodeParameter('mobiles', index, '') as unknown;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const emails = parseContactList(emailsRaw, '邮箱列表', this);
		const mobiles = parseContactList(mobilesRaw, '手机列表', this);

		if (emails.length === 0 && mobiles.length === 0) {
			throw new NodeOperationError(this.getNode(), '邮箱列表与手机列表至少填写一项');
		}
		validateContactListSize(emails, '邮箱列表', this);
		validateContactListSize(mobiles, '手机列表', this);

		const body: IDataObject = {};
		if (emails.length > 0) {
			body.emails = emails;
		}
		if (mobiles.length > 0) {
			body.mobiles = mobiles;
		}
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/user/batch_get_id',
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

export default UserBatchGetIdOperate;
