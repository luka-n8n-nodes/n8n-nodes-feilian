import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

export default {
	name: '更新哑终端',
	value: 'wifi:dumb_terminal:update',
	order: 100,
	options: [
		{
			displayName: '哑终端 ID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: '名称',
			name: 'name',
			type: 'string',
			default: '',
		},
		{
			displayName: '设备类型 ID',
			name: 'class_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '设备类型名称',
			name: 'class_name',
			type: 'string',
			default: '',
		},
		{
			displayName: 'MAC 地址',
			name: 'mac',
			type: 'string',
			default: '',
		},
		{
			displayName: '启用状态',
			name: 'enabled',
			type: 'options',
			options: [
				{ name: '不设置', value: '' },
				{ name: '启用', value: 'true' },
				{ name: '禁用', value: 'false' },
			],
			default: '',
		},
		{
			displayName: '描述',
			name: 'description',
			type: 'string',
			default: '',
		},
		{
			displayName: '用户 ID',
			name: 'user_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '有效期开始时间',
			name: 'validity_start_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳，0 表示不传',
		},
		{
			displayName: '有效期结束时间',
			name: 'validity_end_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳，0 表示不传',
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
		const name = this.getNodeParameter('name', index, '') as string;
		const class_id = this.getNodeParameter('class_id', index, '') as string;
		const class_name = this.getNodeParameter('class_name', index, '') as string;
		const mac = this.getNodeParameter('mac', index, '') as string;
		const enabledRaw = this.getNodeParameter('enabled', index, '') as string;
		const description = this.getNodeParameter('description', index, '') as string;
		const user_id = this.getNodeParameter('user_id', index, '') as string;
		const validity_start_time = this.getNodeParameter('validity_start_time', index, 0) as number;
		const validity_end_time = this.getNodeParameter('validity_end_time', index, 0) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const body: IDataObject = { id };
		if (name) body.name = name;
		if (class_id) body.class_id = class_id;
		if (class_name) body.class_name = class_name;
		if (mac) body.mac = mac;
		if (enabledRaw === 'true' || enabledRaw === 'false') {
			body.enabled = enabledRaw === 'true';
		}
		if (description) body.description = description;
		if (user_id) body.user_id = user_id;
		if (validity_start_time) body.validity_start_time = validity_start_time;
		if (validity_end_time) body.validity_end_time = validity_end_time;

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/wifi/dumb_terminal/update',
			body,
		};
		if (options.timeout) requestOptions.timeout = options.timeout;
		return RequestUtils.request.call(this, requestOptions) as Promise<IDataObject>;
	},
} as ResourceOperations;
