import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import { batchingOption, timeoutOption } from '../../../help/utils/sharedOptions';

const licModeOptions = [
	{ name: '不设置', value: 0 },
	{ name: '用户许可', value: 1 },
	{ name: '设备许可', value: 2 },
];

const boolOptions = [
	{ name: '不设置', value: '' },
	{ name: '是', value: 'true' },
	{ name: '否', value: 'false' },
];

const SoftwareLicenseUpdateOperate: ResourceOperations = {
	name: '更新软件许可管理信息',
	value: 'software:license:update',
	order: 70,
	options: [
		{
			displayName: '许可管理项 ID',
			name: 'id',
			type: 'number',
			required: true,
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
			displayName: '开启许可管理',
			name: 'lic_switch',
			type: 'options',
			options: boolOptions,
			default: '',
			description: '是否开启许可管理',
		},
		{
			displayName: '禁用软件',
			name: 'disable_switch',
			type: 'options',
			options: boolOptions,
			default: '',
			description: '是否禁用软件',
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
		const id = this.getNodeParameter('id', index) as number;
		const lic_mode = this.getNodeParameter('lic_mode', index, 0) as number;
		const licSwitchRaw = this.getNodeParameter('lic_switch', index, '') as string;
		const disableSwitchRaw = this.getNodeParameter('disable_switch', index, '') as string;
		const lic_quota = this.getNodeParameter('lic_quota', index, 0) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const body: IDataObject = { id };
		if (lic_mode) {
			body.lic_mode = lic_mode;
		}
		if (licSwitchRaw === 'true' || licSwitchRaw === 'false') {
			body.lic_switch = licSwitchRaw === 'true';
		}
		if (disableSwitchRaw === 'true' || disableSwitchRaw === 'false') {
			body.disable_switch = disableSwitchRaw === 'true';
		}
		if (lic_quota) {
			body.lic_quota = lic_quota;
		}

		const requestOptions: IHttpRequestOptions = {
			method: 'POST',
			url: '/api/open/v1/software/license/update',
			body,
		};
		if (options.timeout) {
			requestOptions.timeout = options.timeout;
		}

		return (await RequestUtils.request.call(this, requestOptions)) as IDataObject;
	},
};

export default SoftwareLicenseUpdateOperate;
