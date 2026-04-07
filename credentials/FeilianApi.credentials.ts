import {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	INodeProperties,
} from 'n8n-workflow';

export class FeilianApi implements ICredentialType {
	name = 'feilianApi';
	displayName = '飞连 API';
	icon = 'file:../nodes/Feilian/feilian.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseURL',
			type: 'string',
			default: '',
			placeholder: 'https://your-feilian-domain.com',
			description: '飞连服务端地址，例如 https://xxx.volceapplet.com',
			required: true,
		},
		{
			displayName: 'Access Key ID',
			name: 'accessKeyId',
			type: 'string',
			default: '',
			description: '开放平台应用的 Access Key ID',
			required: true,
		},
		{
			displayName: 'Access Key Secret',
			name: 'accessKeySecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: '开放平台应用的 Access Key Secret',
			required: true,
		},
		{
			displayName: 'AccessToken',
			name: 'accessToken',
			type: 'hidden',
			default: '',
			typeOptions: {
				expirable: true,
			},
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		const res = (await this.helpers.httpRequest({
			method: 'POST',
			baseURL: credentials.baseURL as string,
			url: '/api/open/v1/token',
			body: {
				access_key_id: credentials.accessKeyId,
				access_key_secret: credentials.accessKeySecret,
			},
		})) as { code: number; message: string; data?: { access_token: string } };

		if (res.code !== 0) {
			throw new Error('飞连授权失败：' + res.code + ', ' + res.message);
		}

		return { accessToken: res.data?.access_token };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseURL}}',
			url: '/api/open/v1/token',
			method: 'POST',
			body: {
				access_key_id: '={{$credentials.accessKeyId}}',
				access_key_secret: '={{$credentials.accessKeySecret}}',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					message: 'Access Key ID 或 Secret 无效',
					key: 'code',
					value: 40001,
				},
			},
		],
	};
}
