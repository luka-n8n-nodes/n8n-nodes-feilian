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

const UserGetIdByContactOperate: ResourceOperations = {
	name: '邮箱或手机换用户信息',
	value: 'user:get_id',
	order: 50,
	options: [
		{
			displayName: '邮箱',
			name: 'email',
			type: 'string',
			default: '',
			placeholder: 'name@email.com',
		},
		{
			displayName: '手机',
			name: 'mobile',
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
		const email = this.getNodeParameter('email', index, '') as string;
		const mobile = this.getNodeParameter('mobile', index, '') as string;
		if (!email && !mobile) {
			throw new NodeOperationError(
				this.getNode(),
				'邮箱与手机至少填写一项',
			);
		}
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = {};
		if (email) body.email = email;
		if (mobile) body.mobile = mobile;
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/user/get_id',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default UserGetIdByContactOperate;
