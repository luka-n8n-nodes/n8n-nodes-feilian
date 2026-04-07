import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const accountStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '正常运行', value: 1 },
	{ name: '暂停使用', value: 2 },
	{ name: '已离职', value: 3 },
	{ name: '未激活', value: 4 },
];

const connStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '成功', value: 1 },
	{ name: '失败', value: 2 },
	{ name: '降级', value: 3 },
];

export default {
	name: '获取员工 Wi-Fi 的连接日志',
	value: 'wifi:employee:conn:log:list',
	order: 10,
	options: [
		{
			displayName: '用户 ID',
			name: 'id',
			type: 'string',
			default: '',
			description: '用户 ID（ou_xxx）',
		},
		{
			displayName: '账号状态',
			name: 'account_status',
			type: 'options',
			options: accountStatusOptions,
			default: 0,
			description: '账号状态筛选',
		},
		{
			displayName: '连接开始时间',
			name: 'connect_start_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳，0 表示不传',
		},
		{
			displayName: '连接结束时间',
			name: 'connect_end_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳，0 表示不传',
		},
		{
			displayName: '断开开始时间',
			name: 'disconnect_start_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳，0 表示不传',
		},
		{
			displayName: '断开结束时间',
			name: 'disconnect_end_time',
			type: 'number',
			default: 0,
			description: 'Unix 时间戳，0 表示不传',
		},
		{
			displayName: '连接状态',
			name: 'status',
			type: 'options',
			options: connStatusOptions,
			default: 0,
			description: '连接结果筛选',
		},
		{
			displayName: '设备名称',
			name: 'device_name',
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
			displayName: '连接 IP',
			name: 'connection_ip',
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
		const id = this.getNodeParameter('id', index, '') as string;
		const account_status = this.getNodeParameter('account_status', index, 0) as number;
		const connect_start_time = this.getNodeParameter('connect_start_time', index, 0) as number;
		const connect_end_time = this.getNodeParameter('connect_end_time', index, 0) as number;
		const disconnect_start_time = this.getNodeParameter('disconnect_start_time', index, 0) as number;
		const disconnect_end_time = this.getNodeParameter('disconnect_end_time', index, 0) as number;
		const status = this.getNodeParameter('status', index, 0) as number;
		const device_name = this.getNodeParameter('device_name', index, '') as string;
		const group_id = this.getNodeParameter('group_id', index, '') as string;
		const connection_ip = this.getNodeParameter('connection_ip', index, '') as string;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 50) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {
				account_status,
				status,
			};
			if (id) qs.id = id;
			if (connect_start_time) qs.connect_start_time = connect_start_time;
			if (connect_end_time) qs.connect_end_time = connect_end_time;
			if (disconnect_start_time) qs.disconnect_start_time = disconnect_start_time;
			if (disconnect_end_time) qs.disconnect_end_time = disconnect_end_time;
			if (device_name) qs.device_name = device_name;
			if (group_id) qs.group_id = group_id;
			if (connection_ip) qs.connection_ip = connection_ip;
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
				url: '/api/open/v1/wifi/employee/conn/log/list',
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
