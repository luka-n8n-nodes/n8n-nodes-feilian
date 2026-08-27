import { INodePropertyOptions } from 'n8n-workflow';

export const FEILIAN_ANY_EVENT = '*';

export const feilianEventOptions: INodePropertyOptions[] = [
	{
		name: '所有事件',
		value: FEILIAN_ANY_EVENT,
		description: 'Wildcard *',
	},
	{
		name: '部门新建',
		value: 'department.v1.create',
		description: 'Event Key: department.v1.create',
	},
	{
		name: '部门信息变更',
		value: 'department.v1.update',
		description: 'Event Key: department.v1.update',
	},
	{
		name: '部门被删除',
		value: 'department.v1.delete',
		description: 'Event Key: department.v1.delete',
	},
	{
		name: '新员工入职',
		value: 'user.v1.create',
		description: 'Event Key: user.v1.create',
	},
	{
		name: '员工信息变更',
		value: 'user.v1.update',
		description: 'Event Key: user.v1.update',
	},
	{
		name: '员工账号激活',
		value: 'user.activation.v1.update',
		description: 'Event Key: user.activation.v1.update',
	},
	{
		name: '员工账号状态变更',
		value: 'user.status.v1.update',
		description: 'Event Key: user.status.v1.update',
	},
	{
		name: '角色被删除',
		value: 'role.v1.delete',
		description: 'Event Key: role.v1.delete',
	},
	{
		name: '用户登录认证',
		value: 'auth.v1.login',
		description: 'Event Key: auth.v1.login',
	},
	{
		name: '审批实例状态变更',
		value: 'approval.v1.instance.status.update',
		description: 'Event Key: approval.v1.instance.status.update',
	},
	{
		name: '审批节点操作变更',
		value: 'approval.v1.instance.node.action',
		description: 'Event Key: approval.v1.instance.node.action',
	},
	{
		name: '短信通知',
		value: 'notify.v1.sms',
		description: 'Event Key: notify.v1.sms',
	},
	{
		name: '可信设备签发证书',
		value: 'asset.trusted_device.v1.create_cert',
		description: 'Event Key: asset.trusted_device.v1.create_cert',
	},
	{
		name: '可信设备状态变更',
		value: 'asset.trusted_device.v1.status',
		description: 'Event Key: asset.trusted_device.v1.status',
	},
];
