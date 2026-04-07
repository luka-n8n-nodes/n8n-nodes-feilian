import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

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
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add option',
			default: {},
			options: [batchingOption, timeoutOption],
		},
	] as INodeProperties[],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
		const emailsRaw = this.getNodeParameter('emails', index, '') as string;
		const mobilesRaw = this.getNodeParameter('mobiles', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = {};
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
