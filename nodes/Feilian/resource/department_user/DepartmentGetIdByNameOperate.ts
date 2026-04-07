import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const DepartmentGetIdByNameOperate: ResourceOperations = {
	name: '根据名称获取部门 ID',
	value: 'department:get_id',
	order: 20,
	options: [
		{
			displayName: '部门名称路径',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
			description: '部门名称路径，如 a/b/c',
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
		const name = this.getNodeParameter('name', index) as string;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };
		const body: IDataObject = { name };
		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/department/get_id',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}
		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default DepartmentGetIdByNameOperate;
