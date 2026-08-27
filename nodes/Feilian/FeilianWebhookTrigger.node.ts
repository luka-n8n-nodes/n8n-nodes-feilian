import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import {
	decryptFeilianEvent,
	extractFeilianWebhookBody,
	FeilianWebhookRequest,
	getFeilianEventType,
	getFeilianVerificationToken,
	toFeilianPayloadItems,
} from '../help/utils/FeilianDecryptUtils';
import { FEILIAN_ANY_EVENT, feilianEventOptions } from '../help/utils/feilianEvents';

export class FeilianWebhookTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: '飞连 Webhook Trigger',
		name: 'feilianWebhookTrigger',
		icon: 'file:feilian.svg',
		group: ['trigger'],
		version: [1],
		defaultVersion: 1,
		subtitle: '=已订阅 {{$parameter["events"].length}} 个事件',
		description: '通过 Webhook 接收飞连事件回调，自动解密并处理 URL 验证',
		defaults: {
			name: '飞连 Webhook Trigger',
		},
		usableAsTool: undefined,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'将下方生成的 Webhook URL 配置到飞连管理后台「系统设置 - 集成管理 - 事件订阅」的请求地址中。首次保存时飞连会发送 URL 验证请求，可能是 JSON，也可能是 application/octet-stream 文件；本节点会自动解析并返回 challenge。<a href="https://www.volcengine.com/docs/6427/1510772" target="_blank">参考文档</a>',
				name: 'feilianWebhookNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '事件定义',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [FEILIAN_ANY_EVENT],
				description:
					'选择需要监听的事件。默认通配符「所有事件」会接收全部回调；未选中的事件会返回 HTTP 200 但不触发工作流。',
				options: feilianEventOptions,
			},
			{
				displayName: 'Verification Token',
				name: 'verificationToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				required: true,
				default: '',
				description:
					'飞连事件订阅的 Verification Token。用于校验回调数据中的 token 是否匹配，确保请求来自飞连。',
			},
			{
				displayName: 'Encrypt Key',
				name: 'encryptKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description:
					'飞连事件订阅的 Encrypt Key。若在飞连后台配置了加密策略，则必须填写此项用于解密；若未开启加密可留空。URL 验证请求在配置了 Encrypt Key 时同样会加密。',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const res = this.getResponseObject();
		const body = this.getBodyData() as unknown;
		const req = this.getRequestObject() as FeilianWebhookRequest;

		const verificationToken = (
			(this.getNodeParameter('verificationToken', '') as string) || ''
		).trim();
		const encryptKey = ((this.getNodeParameter('encryptKey', '') as string) || '').trim();
		const events = this.getNodeParameter('events', [FEILIAN_ANY_EVENT]) as string[];

		const extracted = await extractFeilianWebhookBody(body, req);

		let parsed: unknown;
		if (extracted.encrypt) {
			if (!encryptKey) {
				throw new NodeOperationError(
					this.getNode(),
					'请求体已加密，但未配置 Encrypt Key，无法解密',
				);
			}

			const decrypted = decryptFeilianEvent(encryptKey, extracted.encrypt);
			if (!decrypted) {
				throw new NodeOperationError(
					this.getNode(),
					'解密失败，请检查 Encrypt Key 是否与飞连后台配置一致',
				);
			}

			try {
				parsed = JSON.parse(decrypted) as unknown;
			} catch {
				throw new NodeOperationError(this.getNode(), '解密后的数据不是有效的 JSON 格式');
			}
		} else {
			parsed = extracted.payload ?? {};
		}

		const payloadItems = toFeilianPayloadItems(parsed);
		const payload = payloadItems[0] ?? {};

		const token = getFeilianVerificationToken(payload);
		if (!verificationToken || token !== verificationToken) {
			res.status(200).json({ msg: 'invalid verification token' });
			return { noWebhookResponse: true };
		}

		// 首次配置请求地址时，飞连会推送 url_verification，需返回完整解密 JSON
		if (payload.type === 'url_verification') {
			res.status(200).json({
				challenge: payload.challenge,
				token: payload.token,
				type: payload.type,
			});
			return { noWebhookResponse: true };
		}

		const isAnyEvent = events.includes(FEILIAN_ANY_EVENT);
		const matchedItems = payloadItems.filter((item) => {
			if (isAnyEvent) {
				return true;
			}
			const eventType = getFeilianEventType(item);
			return !!eventType && events.includes(eventType);
		});

		// 未匹配的事件：返回 200 确认收到，但不触发工作流
		if (matchedItems.length === 0) {
			res.status(200).json({ msg: 'success' });
			return { noWebhookResponse: true };
		}

		// 普通事件：立即返回 HTTP 200，避免超过 3 秒导致飞连重推
		res.status(200).json({ msg: 'success' });
		return {
			workflowData: [matchedItems.map((item) => ({ json: item }))],
			noWebhookResponse: true,
		};
	}
}
