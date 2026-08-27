# @luka-cat-mimi/n8n-nodes-feilian

飞连 n8n 社区节点，提供飞连开放平台 API 的集成支持，覆盖事件订阅 Webhook 触发、部门与成员管理、Wi-Fi 管理、终端管理、软件管理等场景。

## 安装

参考：https://docs.n8n.io/integrations/community-nodes/installation/

节点名称：`@luka-cat-mimi/n8n-nodes-feilian`

## 功能列表

### 飞连 Webhook Trigger

通过 **Webhook** 接收飞连事件订阅回调。将节点生成的 URL 配置到飞连管理后台「系统设置 - 集成管理 - 事件订阅」的请求地址中。

**主要特点：**

- 固定 POST，自动处理首次 URL 验证（`url_verification`），返回完整 challenge JSON
- 支持 Verification Token 校验；可选 Encrypt Key，按 AES-256-CBC 解密加密推送
- 兼容 JSON body 与 `application/octet-stream` 文件推送
- 默认订阅**所有事件**，也可按 `header.event_type` 多选过滤；未匹配事件返回 HTTP 200 但不触发工作流

**支持的事件：**

| 事件名称 | Event Key |
| --- | --- |
| 所有事件 | `*` |
| 部门新建 | `department.v1.create` |
| 部门信息变更 | `department.v1.update` |
| 部门被删除 | `department.v1.delete` |
| 新员工入职 | `user.v1.create` |
| 员工信息变更 | `user.v1.update` |
| 员工账号激活 | `user.activation.v1.update` |
| 员工账号状态变更 | `user.status.v1.update` |
| 角色被删除 | `role.v1.delete` |
| 用户登录认证 | `auth.v1.login` |
| 审批实例状态变更 | `approval.v1.instance.status.update` |
| 审批节点操作变更 | `approval.v1.instance.node.action` |
| 短信通知 | `notify.v1.sms` |
| 可信设备签发证书 | `asset.trusted_device.v1.create_cert` |
| 可信设备状态变更 | `asset.trusted_device.v1.status` |

> 请先激活工作流，再在飞连后台保存请求地址，以便完成 URL 有效性验证。

### 部门与成员 (18)

- 获取部门列表
- 根据名称获取部门 ID
- 获取用户详情
- 邮箱或手机换用户信息
- 姓名换用户信息
- 批量查询用户详情
- 邮箱或手机批量获取用户 ID
- 获取某个部门的成员（支持递归子部门成员）
- 获取部门数和用户数
- 重置用户密码
- 创建角色
- 获取角色列表
- 获取角色详情（支持自动分页获取角色成员）
- 更新角色基本信息
- 删除角色
- 添加角色成员
- 更新角色成员
- 删除角色成员

### Wi-Fi (12)

- 获取哑终端列表
- 批量创建哑终端
- 更新哑终端
- 批量删除哑终端设备
- 获取哑终端设备类型列表
- 创建哑终端设备类型
- 更新哑终端设备类型
- 批量删除哑终端设备类型
- 获取哑终端连接日志
- 获取员工 Wi-Fi 的连接日志
- 查看员工的 Wi-Fi 启用状态
- 获取访客 Wi-Fi 的连接日志

### 终端管理 (5)

- 获取设备列表
- did 换设备信息
- 获取设备登陆日志
- 获取对应设备的软件列表
- 获取设备大盘信息

### 软件管理 (10)

- 软件列表
- 软件安装详情
- 获取软件安装用户的使用时长
- 获取终端上报软件列表
- 获取软件许可管理列表
- 添加许可管理软件
- 更新软件许可管理信息
- 获取软件许可授权详情
- 添加软件许可授权对象
- 移除软件许可授权对象

## ✨ 特别之处

### 🔄 Return All 自动分页

以下接口支持 **Return All** 功能，自动处理分页获取全部数据：

| 模块       | 接口名称                  |
| ---------- | ------------------------- |
| 部门与成员 | 获取某个部门的成员        |
| 部门与成员 | 获取角色详情              |
| Wi-Fi      | 获取哑终端列表            |
| Wi-Fi      | 获取哑终端设备类型列表    |
| Wi-Fi      | 获取哑终端连接日志        |
| Wi-Fi      | 获取员工 Wi-Fi 的连接日志 |
| Wi-Fi      | 获取访客 Wi-Fi 的连接日志 |
| 终端管理   | 获取设备列表              |
| 终端管理   | 获取设备登陆日志          |
| 终端管理   | 获取对应设备的软件列表    |
| 软件管理   | 软件列表                  |
| 软件管理   | 软件安装详情              |
| 软件管理   | 获取软件安装用户的使用时长 |
| 软件管理   | 获取终端上报软件列表      |
| 软件管理   | 获取软件许可管理列表      |
| 软件管理   | 获取软件许可授权详情      |

### ⏱️ 超时与批次管理

大部分接口支持以下高级选项：

- **Timeout（超时时间）**：设置请求超时时间（毫秒），避免请求长时间挂起
- **Batching（批次管理）**：
  - **Items per Batch**：每批处理的数量，用于控制请求频率
  - **Batch Interval (ms)**：每批请求之间的等待时间，避免触发 API 限流

这些功能可在接口的 `Options` 选项中配置，有效应对飞连 API 的频率限制。

## 凭证类型

- **飞连 API 凭证** - 使用飞连开放平台的 API Key 和 API Secret 进行认证

## 注意事项

1. 使用 API 节点前需要在飞连开放平台创建应用并获取 API Key 和 API Secret
2. 部分接口需要相应的权限配置
3. 使用 Webhook Trigger 时需填写事件订阅的 Verification Token；若开启加密推送，还需填写 Encrypt Key

## 📝 许可证

MIT License

## 🆘 支持

- 📧 邮箱：luka.cat.mimi@gmail.com
- 🐛 [问题反馈](https://github.com/luka-n8n-nodes/n8n-nodes-feilian/issues)
