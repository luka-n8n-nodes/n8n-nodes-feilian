import * as crypto from 'crypto';
import { IDataObject } from 'n8n-workflow';

class AESCipher {
	private key: Buffer;

	constructor(key: string) {
		const hash = crypto.createHash('sha256');
		hash.update(key);
		this.key = hash.digest();
	}

	decrypt(encrypt: string): string | null {
		try {
			const encryptBuffer = Buffer.from(encrypt, 'base64');
			const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, encryptBuffer.slice(0, 16));
			let decrypted = decipher.update(encryptBuffer.slice(16).toString('hex'), 'hex', 'utf8');
			decrypted += decipher.final('utf8');
			return decrypted;
		} catch {
			return null;
		}
	}
}

/**
 * 解密飞连事件消息
 * 加密原理：SHA256(Encrypt Key) 作为 AES-256-CBC 密钥，密文为 base64(iv + encrypted_event)
 */
export function decryptFeilianEvent(encryptKey: string, encryptData: string): string | null {
	const cipher = new AESCipher(encryptKey);
	return cipher.decrypt(encryptData);
}

export interface FeilianWebhookRequest {
	body?: unknown;
	rawBody?: Buffer | string | Uint8Array;
	contentType?: string;
	headers?: Record<string, string | string[] | undefined>;
	readRawBody?: () => Promise<void>;
}

export interface FeilianExtractedBody {
	encrypt?: string;
	payload?: IDataObject;
}

function parseObjectOrEncrypt(value: unknown): FeilianExtractedBody | null {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (!trimmed) {
			return null;
		}
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			try {
				return parseObjectOrEncrypt(JSON.parse(trimmed) as unknown);
			} catch {
				return { encrypt: trimmed };
			}
		}
		return { encrypt: trimmed };
	}

	if (value && typeof value === 'object' && !Array.isArray(value)) {
		const obj = value as IDataObject;
		if (typeof obj.encrypt === 'string' && obj.encrypt) {
			return { encrypt: obj.encrypt };
		}
		return { payload: obj };
	}

	return null;
}

/**
 * 兼容文件内容 JSON：
 * - { encrypt }
 * - { data: { encrypt } }
 * - { data: "{ encrypt }" }
 */
function normalizeExtracted(extracted: FeilianExtractedBody | null): FeilianExtractedBody {
	if (!extracted) {
		return { payload: {} };
	}
	if (extracted.encrypt) {
		return extracted;
	}

	const payload = extracted.payload;
	if (!payload) {
		return { payload: {} };
	}

	if (typeof payload.encrypt === 'string' && payload.encrypt) {
		return { encrypt: payload.encrypt };
	}

	const data = payload.data;
	if (typeof data === 'string') {
		return normalizeExtracted(parseObjectOrEncrypt(data));
	}
	if (data && typeof data === 'object' && !Array.isArray(data)) {
		return normalizeExtracted({ payload: data as IDataObject });
	}

	return extracted;
}

function rawBodyToText(rawBody: unknown): string | undefined {
	if (rawBody === undefined || rawBody === null) {
		return undefined;
	}
	if (Buffer.isBuffer(rawBody)) {
		return rawBody.toString('utf8');
	}
	if (rawBody instanceof Uint8Array) {
		return Buffer.from(rawBody).toString('utf8');
	}
	if (typeof rawBody === 'string') {
		return rawBody;
	}
	return undefined;
}

function isJsonEventBody(body: unknown): boolean {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return false;
	}

	const obj = body as IDataObject;
	if (typeof obj.encrypt === 'string' && obj.encrypt) {
		return true;
	}
	if (obj.type === 'url_verification' || obj.challenge !== undefined) {
		return true;
	}
	if (obj.header !== undefined || obj.event !== undefined) {
		return true;
	}

	const data = obj.data;
	if (data && typeof data === 'object' && !Array.isArray(data)) {
		return typeof (data as IDataObject).encrypt === 'string';
	}

	return false;
}

async function readIncomingFileText(req: FeilianWebhookRequest): Promise<string | undefined> {
	if (typeof req.readRawBody === 'function' && req.rawBody === undefined) {
		await req.readRawBody();
	}
	return rawBodyToText(req.rawBody);
}

/**
 * 从 Webhook 请求中提取加密字符串或明文 JSON。
 * 兼容：
 * - JSON body（明文、{ encrypt }）
 * - application/octet-stream 文件（文件内容为 JSON 文本，再取 encrypt）
 */
export async function extractFeilianWebhookBody(
	body: unknown,
	req: FeilianWebhookRequest,
): Promise<FeilianExtractedBody> {
	if (isJsonEventBody(body)) {
		return normalizeExtracted(parseObjectOrEncrypt(body));
	}

	// 飞连首次 URL 验证可能以 application/octet-stream 文件推送，文件内容为 JSON 文本
	const fileText = await readIncomingFileText(req);
	if (fileText) {
		const fromFile = parseObjectOrEncrypt(fileText);
		if (fromFile?.encrypt || (fromFile?.payload && Object.keys(fromFile.payload).length > 0)) {
			return normalizeExtracted(fromFile);
		}
	}

	const fromBody = parseObjectOrEncrypt(body);
	if (fromBody?.encrypt) {
		return fromBody;
	}
	if (fromBody?.payload && Object.keys(fromBody.payload).length > 0) {
		return normalizeExtracted(fromBody);
	}

	return { payload: (fromBody?.payload as IDataObject) ?? {} };
}

export function getFeilianVerificationToken(payload: IDataObject): string {
	const header = (payload.header as IDataObject) || {};
	const token = payload.token ?? header.token;
	return typeof token === 'string' ? token : token !== undefined ? String(token) : '';
}

export function getFeilianEventType(payload: IDataObject): string {
	const header = (payload.header as IDataObject) || {};
	const eventType = header.event_type;
	return typeof eventType === 'string'
		? eventType
		: eventType !== undefined
			? String(eventType)
			: '';
}

export function toFeilianPayloadItems(value: unknown): IDataObject[] {
	if (Array.isArray(value)) {
		return value.filter(
			(item): item is IDataObject =>
				item !== null && typeof item === 'object' && !Array.isArray(item),
		);
	}
	if (value && typeof value === 'object') {
		return [value as IDataObject];
	}
	return [];
}
