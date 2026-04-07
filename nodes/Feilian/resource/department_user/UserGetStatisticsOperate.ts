import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const UserGetStatisticsOperate: ResourceOperations = {
	name: '获取部门数和用户数',
	value: 'user:statistics',
	order: 90,
	options: [
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
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const requestOptions: IHttpRequestOptions = {
			method: 'GET',
			url: '/api/open/v1/user/statistics',
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default UserGetStatisticsOperate;
