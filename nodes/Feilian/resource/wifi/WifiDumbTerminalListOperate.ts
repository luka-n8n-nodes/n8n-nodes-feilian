import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const onlineStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '离线', value: 1 },
	{ name: '在线', value: 2 },
];

const deviceStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '启用', value: 1 },
	{ name: '禁用', value: 2 },
];

export default {
	name: '获取哑终端列表',
	value: 'wifi:dumb_terminal:list',
	order: 110,
	options: [
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
			displayName: 'MAC 地址',
			name: 'mac',
			type: 'string',
			default: '',
		},
		{
			displayName: '在线状态',
			name: 'status',
			type: 'options',
			options: onlineStatusOptions,
			default: 0,
		},
		{
			displayName: 'IP',
			name: 'ip',
			type: 'string',
			default: '',
		},
		{
			displayName: '分组 ID',
			name: 'group_id',
			type: 'string',
			default: '',
		},
		{
			displayName: '设备启用状态',
			name: 'device_status',
			type: 'options',
			options: deviceStatusOptions,
			default: 0,
		},
		{
			displayName: '用户 ID',
			name: 'user_id',
			type: 'string',
			default: '',
		},
		paginationOptions.returnAll,
		paginationOptions.limit(200),
		{
			displayName: 'Options',
			name: 'options',
			type: 'collection',
			placeholder: 'Add option',
			default: {},
			options: [timeoutOption],
		},
	] as INodeProperties[],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject[]> {
		const name = this.getNodeParameter('name', index, '') as string;
		const class_id = this.getNodeParameter('class_id', index, '') as string;
		const mac = this.getNodeParameter('mac', index, '') as string;
		const status = this.getNodeParameter('status', index, 0) as number;
		const ip = this.getNodeParameter('ip', index, '') as string;
		const group_id = this.getNodeParameter('group_id', index, '') as string;
		const device_status = this.getNodeParameter('device_status', index, 0) as number;
		const user_id = this.getNodeParameter('user_id', index, '') as string;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {
				status,
				device_status,
			};
			if (name) qs.name = name;
			if (class_id) qs.class_id = class_id;
			if (mac) qs.mac = mac;
			if (ip) qs.ip = ip;
			if (group_id) qs.group_id = group_id;
			if (user_id) qs.user_id = user_id;
			return qs;
		};

		const fetchPage = async (offset: number, pageSize: number) => {
			const qs: IDataObject = {
				...buildBaseQs(),
				offset,
				limit: pageSize,
			};
			const requestOptions: IHttpRequestOptions = {
				method: 'GET',
				url: '/api/open/v1/wifi/dumb_terminal/list',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			const responseData = response as { items?: IDataObject[]; count?: number };
			return { items: responseData.items || [], count: responseData.count || 0 };
		};

		if (returnAll) {
			let allResults: IDataObject[] = [];
			let offset = 0;
			const pageSize = 200;
			while (true) {
				const { items, count } = await fetchPage(offset, pageSize);
				allResults = allResults.concat(items);
				offset += items.length;
				if (offset >= count || items.length === 0) break;
			}
			return allResults;
		} else {
			const { items } = await fetchPage(0, limit);
			return items;
		}
	},
} as ResourceOperations;
