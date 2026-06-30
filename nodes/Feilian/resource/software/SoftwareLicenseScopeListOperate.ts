import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const userTypeOptions = [
	{ name: '全部', value: 0 },
	{ name: '用户', value: 1 },
	{ name: '部门', value: 2 },
	{ name: '角色', value: 3 },
];

const licSwitchOptions = [
	{ name: '全部', value: 0 },
	{ name: '已授权', value: 1 },
	{ name: '未授权', value: 2 },
];

const softwareStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '使用中', value: 1 },
	{ name: '已卸载', value: 2 },
	{ name: '已禁用', value: 3 },
	{ name: '未安装', value: 4 },
];

const riskStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '有风险', value: 1 },
	{ name: '无风险', value: 2 },
];

const SoftwareLicenseScopeListOperate: ResourceOperations = {
	name: '获取软件许可授权详情',
	value: 'software:license:scope:list',
	order: 80,
	options: [
		{
			displayName: '许可管理项 ID',
			name: 'id',
			type: 'number',
			required: true,
			default: 0,
		},
		{
			displayName: '用户类型',
			name: 'user_type',
			type: 'options',
			options: userTypeOptions,
			default: 0,
			description: '当 user_type 为全部时，filter_id 无效',
		},
		{
			displayName: '筛选 ID',
			name: 'filter_id',
			type: 'string',
			default: '',
			description: '与 user_type 对应的 open_id',
		},
		{
			displayName: '设备 ID',
			name: 'device_id',
			type: 'string',
			default: '',
			description: '仅在设备许可模式下有效',
		},
		{
			displayName: '许可授权状态',
			name: 'lic_switch',
			type: 'options',
			options: licSwitchOptions,
			default: 0,
		},
		{
			displayName: '软件状态',
			name: 'software_status',
			type: 'options',
			options: softwareStatusOptions,
			default: 0,
		},
		{
			displayName: '软件风险状态',
			name: 'risk_status',
			type: 'options',
			options: riskStatusOptions,
			default: 0,
		},
		paginationOptions.returnAll,
		paginationOptions.limit(200, 1, 20),
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
		const id = this.getNodeParameter('id', index) as number;
		const user_type = this.getNodeParameter('user_type', index, 0) as number;
		const filter_id = this.getNodeParameter('filter_id', index, '') as string;
		const device_id = this.getNodeParameter('device_id', index, '') as string;
		const lic_switch = this.getNodeParameter('lic_switch', index, 0) as number;
		const software_status = this.getNodeParameter('software_status', index, 0) as number;
		const risk_status = this.getNodeParameter('risk_status', index, 0) as number;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {
				id,
				user_type,
				lic_switch,
				software_status,
				risk_status,
			};
			if (user_type && filter_id) qs.filter_id = filter_id;
			if (device_id) qs.device_id = device_id;
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
				url: '/api/open/v1/software/license/scope/list',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			if (Array.isArray(response)) {
				return { items: response as IDataObject[], count: response.length };
			}
			const responseData = response as {
				scope_list?: IDataObject[];
				license_scope_list?: IDataObject[];
				list?: IDataObject[];
				items?: IDataObject[];
				count?: number;
			};
			const items =
				responseData.scope_list ??
				responseData.license_scope_list ??
				responseData.list ??
				responseData.items ??
				[];
			return { items, count: responseData.count || 0 };
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

export default SoftwareLicenseScopeListOperate;
