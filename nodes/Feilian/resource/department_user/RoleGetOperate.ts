import { IDataObject, IExecuteFunctions, INodeProperties, IHttpRequestOptions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperations } from '../../../help/type/IResource';
import {
	batchingOption,
	paginationOptions,
	timeoutOption,
} from '../../../help/utils/sharedOptions';

type RoleGetResponse = IDataObject & {
	members?: IDataObject[];
	member_list?: IDataObject[];
	users?: IDataObject[];
	count?: number;
	total?: number;
};

const memberKeys = ['members', 'member_list', 'users'] as const;

function getMemberKey(response: RoleGetResponse): (typeof memberKeys)[number] {
	return memberKeys.find((key) => Array.isArray(response[key])) ?? 'members';
}

function getMembers(response: RoleGetResponse): IDataObject[] {
	const memberKey = getMemberKey(response);
	return (response[memberKey] as IDataObject[] | undefined) ?? [];
}

function getTotal(response: RoleGetResponse, fallback: number): number {
	return response.count ?? response.total ?? fallback;
}

const RoleGetOperate: ResourceOperations = {
	name: '获取角色详情',
	value: 'role:get',
	order: 130,
	options: [
		{
			displayName: '角色 ID',
			name: 'id',
			type: 'string',
			required: true,
			default: '',
			description: '角色 ID，格式 or_xxx',
		},
		{
			displayName: '角色成员生效状态',
			name: 'status',
			type: 'options',
			options: [
				{ name: '全部', value: 0 },
				{ name: '生效中', value: 1 },
				{ name: '未生效', value: 2 },
				{ name: '已失效', value: 3 },
			],
			default: 1,
		},
		paginationOptions.returnAll,
		paginationOptions.limit(200, 1, 20),
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
		const id = this.getNodeParameter('id', index) as string;
		const status = this.getNodeParameter('status', index, 1) as number;
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const limit = this.getNodeParameter('limit', index, 20) as number;
		const options = this.getNodeParameter('options', index, {}) as { timeout?: number };

		const fetchPage = async (offset: number, pageSize: number): Promise<RoleGetResponse> => {
			const qs: IDataObject = { id, status, offset, limit: pageSize };
			const requestOptions: IHttpRequestOptions = {
				method: 'GET',
				url: '/api/open/v1/role/get',
				qs,
			};
			if (options.timeout) {
				requestOptions.timeout = options.timeout;
			}
			return (await RequestUtils.request.call(this, requestOptions)) as RoleGetResponse;
		};

		if (!returnAll) {
			return fetchPage(0, limit);
		}

		let offset = 0;
		const pageSize = 200;
		let allMembers: IDataObject[] = [];
		let firstResponse: RoleGetResponse | undefined;
		let memberKey: ReturnType<typeof getMemberKey> = 'members';

		while (true) {
			const response = await fetchPage(offset, pageSize);
			const items = getMembers(response);
			if (!firstResponse) {
				firstResponse = response;
				memberKey = getMemberKey(response);
			}
			allMembers = allMembers.concat(items);
			offset += items.length;

			const total = getTotal(response, offset);
			if (offset >= total || items.length === 0 || items.length < pageSize) {
				break;
			}
		}

		return {
			...(firstResponse ?? {}),
			[memberKey]: allMembers,
		};
	},
};

export default RoleGetOperate;
