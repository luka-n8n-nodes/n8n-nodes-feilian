import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const DeviceSearchOperate: ResourceOperations = {
	name: '获取设备列表',
	value: 'device:search',
	order: 30,
	options: [
		{
			displayName: '用户 ID',
			name: 'id',
			type: 'string',
			default: '',
			description: '用户 ID（ou_xxx）',
		},
		{
			displayName: '设备 did',
			name: 'did',
			type: 'string',
			default: '',
			description: '设备 did',
		},
		{
			displayName: '设备品牌',
			name: 'brand',
			type: 'string',
			default: '',
			description: '设备品牌',
		},
		{
			displayName: '设备名称',
			name: 'device_name',
			type: 'string',
			default: '',
			description: '设备名称',
		},
		{
			displayName: '设备 IP',
			name: 'client_ip',
			type: 'string',
			default: '',
			description: '设备 IP',
		},
		{
			displayName: '设备 SN 号',
			name: 'serial_number',
			type: 'string',
			default: '',
			description: '设备 SN 号',
		},
		{
			displayName: '设备 MAC 地址',
			name: 'mac_addrs',
			type: 'string',
			default: '',
			description: '设备 MAC 地址',
		},
		{
			displayName: '客户端版本号',
			name: 'app_ver',
			type: 'string',
			default: '',
			description: '客户端版本号',
		},
		{
			displayName: '客户端操作系统',
			name: 'client_os',
			type: 'string',
			default: '',
			description: '客户端操作系统',
		},
		{
			displayName: '设备状态',
			name: 'status',
			type: 'multiOptions',
			default: [],
			description: '设备状态，可多选，多个参数使用逗号分隔',
			options: [
				{ name: '失效设备', value: '0' },
				{ name: '活跃设备', value: '1' },
				{ name: '休眠设备', value: '2' },
			],
		},
		{
			displayName: '终端分组 ID',
			name: 'group_id',
			type: 'number',
			default: 0,
			description: '终端分组 ID（0 表示不传）',
		},
		{
			displayName: '首次在线开始时间',
			name: 'created_start_time',
			type: 'dateTime',
			default: '',
			description: '首次在线开始时间，留空表示不限制',
		},
		{
			displayName: '首次在线结束时间',
			name: 'created_end_time',
			type: 'dateTime',
			default: '',
			description: '首次在线结束时间，留空表示不限制',
		},
		{
			displayName: '最近在线开始时间',
			name: 'updated_start_time',
			type: 'dateTime',
			default: '',
			description: '最近在线开始时间，留空表示不限制',
		},
		{
			displayName: '最近在线结束时间',
			name: 'updated_end_time',
			type: 'dateTime',
			default: '',
			description: '最近在线结束时间，留空表示不限制',
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
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const id = this.getNodeParameter('id', index, '') as string;
		const did = this.getNodeParameter('did', index, '') as string;
		const brand = this.getNodeParameter('brand', index, '') as string;
		const device_name = this.getNodeParameter('device_name', index, '') as string;
		const client_ip = this.getNodeParameter('client_ip', index, '') as string;
		const serial_number = this.getNodeParameter('serial_number', index, '') as string;
		const mac_addrs = this.getNodeParameter('mac_addrs', index, '') as string;
		const app_ver = this.getNodeParameter('app_ver', index, '') as string;
		const client_os = this.getNodeParameter('client_os', index, '') as string;
		const statusArr = this.getNodeParameter('status', index, []) as string[];
		const status = statusArr.length > 0 ? statusArr.join(',') : '';
		const group_id = this.getNodeParameter('group_id', index, 0) as number;
		const created_start_time_raw = this.getNodeParameter('created_start_time', index, '') as string;
		const created_end_time_raw = this.getNodeParameter('created_end_time', index, '') as string;
		const updated_start_time_raw = this.getNodeParameter('updated_start_time', index, '') as string;
		const updated_end_time_raw = this.getNodeParameter('updated_end_time', index, '') as string;
		const created_start_time = created_start_time_raw ? Math.floor(new Date(created_start_time_raw).getTime() / 1000) : 0;
		const created_end_time = created_end_time_raw ? Math.floor(new Date(created_end_time_raw).getTime() / 1000) : 0;
		const updated_start_time = updated_start_time_raw ? Math.floor(new Date(updated_start_time_raw).getTime() / 1000) : 0;
		const updated_end_time = updated_end_time_raw ? Math.floor(new Date(updated_end_time_raw).getTime() / 1000) : 0;

		const buildQs = (offset: number, pageSize: number): IDataObject => {
			const qs: IDataObject = { offset, limit: pageSize };
			if (id) qs.id = id;
			if (did) qs.did = did;
			if (brand) qs.brand = brand;
			if (device_name) qs.device_name = device_name;
			if (client_ip) qs.client_ip = client_ip;
			if (serial_number) qs.serial_number = serial_number;
			if (mac_addrs) qs.mac_addrs = mac_addrs;
			if (app_ver) qs.app_ver = app_ver;
			if (client_os) qs.client_os = client_os;
			if (status) qs.status = status;
			if (group_id) qs.group_id = group_id;
			if (created_start_time) qs.created_start_time = created_start_time;
			if (created_end_time) qs.created_end_time = created_end_time;
			if (updated_start_time) qs.updated_start_time = updated_start_time;
			if (updated_end_time) qs.updated_end_time = updated_end_time;
			return qs;
		};

		const fetchPage = async (offset: number, pageSize: number) => {
			const qs = buildQs(offset, pageSize);
			const requestOptions: IHttpRequestOptions = {
				method: 'GET',
				url: '/api/open/v1/device/search',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			const responseData = response as { devices?: IDataObject[]; count?: number };
			return { items: responseData.devices || [], count: responseData.count || 0 };
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
};

export default DeviceSearchOperate;
