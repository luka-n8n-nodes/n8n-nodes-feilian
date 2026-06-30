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

const MAX_LIST_SIZE = 50;

function parseStringList(raw: unknown, fieldName: string, node: IExecuteFunctions): string[] {
	if (raw === undefined || raw === null || raw === '') {
		return [];
	}

	if (Array.isArray(raw)) {
		return raw
			.map((value) => String(value).trim())
			.filter((value) => value);
	}

	if (typeof raw !== 'string') {
		throw new NodeOperationError(node.getNode(), `${fieldName}必须是字符串或数组`);
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
				.map((item) => String(item).trim())
				.filter((item) => item);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new NodeOperationError(node.getNode(), `解析${fieldName}失败: ${message}`);
		}
	}

	return value
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item);
}

function validateListSize(list: string[], fieldName: string, node: IExecuteFunctions): void {
	if (list.length > MAX_LIST_SIZE) {
		throw new NodeOperationError(node.getNode(), `${fieldName}最多支持 ${MAX_LIST_SIZE} 条数据`);
	}
}

const SoftwareLicenseScopeTargetDeleteOperate: ResourceOperations = {
	name: '移除软件许可授权对象',
	value: 'software:license:scope:target:delete',
	order: 100,
	options: [
		{
			displayName: '许可管理项 ID',
			name: 'id',
			type: 'number',
			required: true,
			default: 0,
		},
		{
			displayName: '授权用户列表',
			name: 'user_ids',
			type: 'string',
			default: '',
			description: '用户 ID 列表，最多 50 个。支持英文逗号分隔、JSON 数组或表达式数组，格式 ou_xxx',
		},
		{
			displayName: '授权部门列表',
			name: 'department_ids',
			type: 'string',
			default: '',
			description: '部门 ID 列表，最多 50 个。支持英文逗号分隔、JSON 数组或表达式数组，格式 od_xxx',
		},
		{
			displayName: '授权角色列表',
			name: 'role_ids',
			type: 'string',
			default: '',
			description: '角色 ID 列表，最多 50 个。支持英文逗号分隔、JSON 数组或表达式数组，格式 or_xxx',
		},
		{
			displayName: '授权设备列表',
			name: 'device_ids',
			type: 'string',
			default: '',
			description: '设备 ID 列表，最多 50 个。支持英文逗号分隔、JSON 数组或表达式数组',
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
		const id = this.getNodeParameter('id', index) as number;
		const userIdsRaw = this.getNodeParameter('user_ids', index, '') as unknown;
		const departmentIdsRaw = this.getNodeParameter('department_ids', index, '') as unknown;
		const roleIdsRaw = this.getNodeParameter('role_ids', index, '') as unknown;
		const deviceIdsRaw = this.getNodeParameter('device_ids', index, '') as unknown;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const user_ids = parseStringList(userIdsRaw, '授权用户列表', this);
		const department_ids = parseStringList(departmentIdsRaw, '授权部门列表', this);
		const role_ids = parseStringList(roleIdsRaw, '授权角色列表', this);
		const device_ids = parseStringList(deviceIdsRaw, '授权设备列表', this);

		validateListSize(user_ids, '授权用户列表', this);
		validateListSize(department_ids, '授权部门列表', this);
		validateListSize(role_ids, '授权角色列表', this);
		validateListSize(device_ids, '授权设备列表', this);

		const body: IDataObject = { id };
		if (user_ids.length) body.user_ids = user_ids;
		if (department_ids.length) body.department_ids = department_ids;
		if (role_ids.length) body.role_ids = role_ids;
		if (device_ids.length) body.device_ids = device_ids;

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/software/license/scope/target/delete',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}

		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default SoftwareLicenseScopeTargetDeleteOperate;
