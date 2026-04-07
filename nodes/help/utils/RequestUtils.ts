import { IExecuteFunctions, IHttpRequestOptions, JsonObject, NodeApiError } from 'n8n-workflow';
import { Credentials } from '../type/enums';

class RequestUtils {
	private static processResponse(res: any) {
		if (res instanceof Buffer || res instanceof ArrayBuffer || res instanceof Uint8Array) {
			return res;
		}

		if (res.code !== 0) {
			throw new Error(`Request Feilian API Error: ${res.code}, ${res.message}`);
		}
		return res.data ?? res;
	}

	static async originRequest(
		this: IExecuteFunctions,
		options: IHttpRequestOptions,
		clearAccessToken = false,
	) {
		const credentials = await this.getCredentials(Credentials.FeilianApi);
		options.baseURL = credentials.baseURL as string;

		const additionalCredentialOptions = {
			credentialsDecrypted: {
				id: '',
				name: Credentials.FeilianApi,
				type: Credentials.FeilianApi,
				data: {
					...credentials,
					accessToken: clearAccessToken ? '' : credentials.accessToken,
				},
			},
		};

		return this.helpers.httpRequestWithAuthentication.call(
			this,
			Credentials.FeilianApi,
			options,
			additionalCredentialOptions,
		);
	}

	static async request(this: IExecuteFunctions, options: IHttpRequestOptions) {
		if (options.json === undefined) options.json = true;

		return RequestUtils.originRequest
			.call(this, options)
			.then((res) => RequestUtils.processResponse(res))
			.catch((error) => {
				if (error.context && error.context.data) {
					let errorData: any = {};

					if (error.context.data.code !== undefined) {
						errorData = error.context.data;
					} else {
						const buffer = Buffer.from(error.context.data);
						if (buffer.length > 0) {
							try {
								errorData = JSON.parse(buffer.toString('utf-8'));
							} catch {
								throw error;
							}
						} else {
							throw error;
						}
					}

					const { code, message: msg } = errorData;

					if (code === 40002 || code === 40003) {
						return RequestUtils.originRequest
							.call(this, options, true)
							.then((res) => RequestUtils.processResponse(res));
					}

					if (code !== 0) {
						throw new NodeApiError(this.getNode(), error as JsonObject, {
							message: `Request Feilian API Error: ${code}, ${msg}`,
						});
					}
				}

				throw error;
			});
	}
}

export default RequestUtils;
