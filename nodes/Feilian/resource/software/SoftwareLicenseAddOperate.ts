import {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	IHttpRequestOptions,
	NodeOperationError,
} from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const MAX_SOFTWARE_INFO_IDS = 50;

const licModeOptions = [
	{ name: '用户许可', value: 1 },
	{ name: '设备许可', value: 2 },
];

function parseIntegerList(raw: unknown, fieldName: string, node: IExecuteFunctions): number[] {
	if (raw === undefined || raw === null || raw === '') {
		return [];
	}

	if (Array.isArray(raw)) {
		return raw
			.map((value) => Number(value))
			.filter((value) => !Number.isNaN(value));
	}

	if (typeof raw === 'number' && !Number.isNaN(raw)) {
		return [raw];
	}

	if (typeof raw !== 'string') {
		throw new NodeOperationError(node.getNode(), `${fieldName}必须是数字、字符串或数组`);
	}

	const value = raw.trim();
	if (!value) {
		return [];
	}

	if (value.startsWith('[')) {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (!Array.isArray(parsed)) {
				throw new Error(`${fieldName}必须是数组`);
			}
			return parsed
				.map((item) => Number(item))
				.filter((item) => !Number.isNaN(item));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(node.getNode(), `解析${fieldName}失败: ${message}`);
		}
	}

	return value
		.split(',')
		.map((item) => Number(item.trim()))
		.filter((item) => !Number.isNaN(item));
}

const SoftwareLicenseAddOperate: ResourceOperations = {
	name: '添加许可管理软件',
	value: 'software:license:add',
	order: 60,
	options: [
		{
			displayName: '软件 ID 列表',
			name: 'software_info_ids',
			type: 'string',
			required: true,
			default: '',
			description: '软件 ID 列表，最多 50 个。支持英文逗号分隔、JSON 数组或表达式数组',
		},
		{
			displayName: '许可类型',
			name: 'lic_mode',
			type: 'options',
			options: licModeOptions,
			required: true,
			default: 1,
		},
		{
			displayName: '开启许可管理',
			name: 'lic_switch',
			type: 'boolean',
			default: true,
			description: 'Whether to enable license management',
		},
		{
			displayName: '禁用软件',
			name: 'disable_switch',
			type: 'boolean',
			default: false,
			description: 'Whether to disable software',
		},
		{
			displayName: '设备许可数量上限',
			name: 'lic_quota',
			type: 'number',
			default: 0,
			description: '设备许可数量上限，仅许可类型为设备许可时有效（0 表示不传）',
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
		const softwareInfoIdsRaw = this.getNodeParameter('software_info_ids', index) as unknown;
		const lic_mode = this.getNodeParameter('lic_mode', index) as number;
		const lic_switch = this.getNodeParameter('lic_switch', index, true) as boolean;
		const disable_switch = this.getNodeParameter('disable_switch', index, false) as boolean;
		const lic_quota = this.getNodeParameter('lic_quota', index, 0) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const software_info_ids = parseIntegerList(softwareInfoIdsRaw, '软件 ID 列表', this);
		if (software_info_ids.length === 0) {
			throw new NodeOperationError(this.getNode(), '软件 ID 列表不能为空');
		}
		if (software_info_ids.length > MAX_SOFTWARE_INFO_IDS) {
			throw new NodeOperationError(
				this.getNode(),
				`软件 ID 列表最多支持 ${MAX_SOFTWARE_INFO_IDS} 个`,
			);
		}

		const body: IDataObject = {
			software_info_ids,
			lic_mode,
			lic_switch,
			disable_switch,
		};
		if (lic_quota) {
			body.lic_quota = lic_quota;
		}

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/software/license/add',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}

		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default SoftwareLicenseAddOperate;
