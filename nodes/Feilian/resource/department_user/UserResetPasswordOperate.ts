import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const UserResetPasswordOperate: ResourceOperations = {
	name: '重置用户密码',
	value: 'user:password:set',
	order: 100,
	options: [
		{
			displayName: '用户 OpenID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
			description: '用户 OpenID，格式 ou_xxx',
		},
		{
			displayName: '自定义密码',
			name: 'custom_passwd',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
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
		const custom_passwd = this.getNodeParameter('custom_passwd', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { id, custom_passwd };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/user/password/set',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default UserResetPasswordOperate;
