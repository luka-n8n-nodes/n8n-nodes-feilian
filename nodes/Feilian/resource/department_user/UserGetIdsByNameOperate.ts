import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const UserGetIdsByNameOperate: ResourceOperations = {
	name: '姓名换用户信息',
	value: 'user:get_ids',
	order: 80,
	options: [
		{
			displayName: '用户姓名',
			name: 'user_name',
			type: 'string',
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
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
		const user_name = this.getNodeParameter('user_name', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { user_name };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/user/get_ids',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		const response = await RequestUtils.request.call(this, requestOptions);
		if (Array.isArray(response)) {
			return response as IDataObject[];
		}
		return [];
	},
};

export default UserGetIdsByNameOperate;
