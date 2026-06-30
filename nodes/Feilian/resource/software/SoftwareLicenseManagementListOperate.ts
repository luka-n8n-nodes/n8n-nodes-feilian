import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { paginationOptions, timeoutOption } from '../../../help/utils/sharedOptions';

const osOptions = [
	{ name: '全部', value: '' },
	{ name: 'Windows', value: 'windows' },
	{ name: 'Mac', value: 'mac' },
];

const softwareTypeOptions = [
	{ name: '全部', value: 0 },
	{ name: '系统内置', value: 1 },
	{ name: '自定义', value: 2 },
];

const licSwitchOptions = [
	{ name: '全部', value: 0 },
	{ name: '已开启', value: 1 },
	{ name: '未开启', value: 2 },
];

const licModeOptions = [
	{ name: '全部', value: 0 },
	{ name: '用户许可', value: 1 },
	{ name: '设备许可', value: 2 },
];

const disableSwitchOptions = [
	{ name: '全部', value: 0 },
	{ name: '已禁用', value: 1 },
	{ name: '未禁用', value: 2 },
];

const riskStatusOptions = [
	{ name: '全部', value: 0 },
	{ name: '有风险', value: 1 },
	{ name: '无风险', value: 2 },
];

const SoftwareLicenseManagementListOperate: ResourceOperations = {
	name: '获取软件许可管理列表',
	value: 'software:license:management:list',
	order: 50,
	options: [
		{
			displayName: '许可管理项 ID',
			name: 'id',
			type: 'number',
			default: 0,
			description: '许可管理项 ID（0 表示不传）',
		},
		{
			displayName: '操作系统',
			name: 'os',
			type: 'options',
			options: osOptions,
			default: '',
		},
		{
			displayName: '软件 ID',
			name: 'software_info_id',
			type: 'number',
			default: 0,
			description: '软件 ID（0 表示不传）',
		},
		{
			displayName: '软件名称',
			name: 'software_name',
			type: 'string',
			default: '',
			description: '支持模糊查询',
		},
		{
			displayName: '软件来源',
			name: 'software_type',
			type: 'options',
			options: softwareTypeOptions,
			default: 0,
		},
		{
			displayName: '许可管理开关',
			name: 'lic_switch',
			type: 'options',
			options: licSwitchOptions,
			default: 0,
		},
		{
			displayName: '许可类型',
			name: 'lic_mode',
			type: 'options',
			options: licModeOptions,
			default: 0,
		},
		{
			displayName: '软件禁用状态',
			name: 'disable_switch',
			type: 'options',
			options: disableSwitchOptions,
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
		const id = this.getNodeParameter('id', index, 0) as number;
		const os = this.getNodeParameter('os', index, '') as string;
		const software_info_id = this.getNodeParameter('software_info_id', index, 0) as number;
		const software_name = this.getNodeParameter('software_name', index, '') as string;
		const software_type = this.getNodeParameter('software_type', index, 0) as number;
		const lic_switch = this.getNodeParameter('lic_switch', index, 0) as number;
		const lic_mode = this.getNodeParameter('lic_mode', index, 0) as number;
		const disable_switch = this.getNodeParameter('disable_switch', index, 0) as number;
		const risk_status = this.getNodeParameter('risk_status', index, 0) as number;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const buildBaseQs = (): IDataObject => {
			const qs: IDataObject = {
				software_type,
				lic_switch,
				lic_mode,
				disable_switch,
				risk_status,
			};
			if (id) qs.id = id;
			if (os) qs.os = os;
			if (software_info_id) qs.software_info_id = software_info_id;
			if (software_name) qs.software_name = software_name;
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
				url: '/api/open/v1/software/license/management/list',
				qs,
			};
			if (options.timeout) requestOptions.timeout = options.timeout;
			const response = await RequestUtils.request.call(this, requestOptions);
			if (Array.isArray(response)) {
				return { items: response as IDataObject[], count: response.length };
			}
			const responseData = response as {
				management_list?: IDataObject[];
				license_list?: IDataObject[];
				list?: IDataObject[];
				items?: IDataObject[];
				count?: number;
			};
			const items =
				responseData.management_list ??
				responseData.license_list ??
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

export default SoftwareLicenseManagementListOperate;
