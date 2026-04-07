import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const UserGetDetailOperate: ResourceOperations = {
	name: '获取用户详情',
	value: 'user:get',
	order: 40,
	options: [
		{
			displayName: '用户 ID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
			description: '用户 ID，格式 ou_xxx',
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
		const qs: IDataObject = { id };
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/user/get',
			qs,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default UserGetDetailOperate;
