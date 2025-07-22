import { requestClient } from '#/api/request';

export type AuthMode = 'password' | 'key';

export type Status =
  | 'RUNNING'
  | 'STOPPED'
  | 'STARTING'
  | 'STOPPING'
  | 'RESTARTING'
  | 'DELETING'
  | 'ERROR';

export interface TreeLocalResource {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  status: Status;
  environment: string;
  description: string;
  tags: string[];
  cpu: number;
  memory: number;
  disk: number;
  ip_addr: string;
  port: number;
  username: string;
  key: string;
  auth_mode: AuthMode;
  os_type: string;
  os_name: string;
  image_name: string;
}

export interface GetTreeLocalListParams {
  page: number;
  size: number;
  search?: string;
  status?: string;
  environment?: string;
}

export interface CreateTreeLocalParams {
  name: string;
  environment?: string;
  description?: string;
  tags?: string[];
  ip_addr: string;
  port?: number;
  username?: string;
  password?: string;
  os_type?: string;
  os_name?: string;
  image_name?: string;
  key?: string;
  auth_mode?: AuthMode;
}

export interface UpdateTreeLocalParams {
  name?: string;
  environment?: string;
  description?: string;
  tags?: string[];
  ip_addr?: string;
  port?: number;
  os_type?: string;
  os_name?: string;
  image_name?: string;
  username?: string;
  password?: string;
  key?: string;
  auth_mode?: AuthMode;
}

export interface BindLocalResourceParams {
  tree_node_ids: number[];
}

export interface UnbindLocalResourceParams {
  tree_node_ids: number[];
}

export function getTreeLocalList(params: GetTreeLocalListParams) {
  return requestClient.get('/tree/local/list', { params });
}

export function getTreeLocalDetail(id: number) {
  return requestClient.get(`/tree/local/detail/${id}`);
}

export function createTreeLocal(data: CreateTreeLocalParams) {
  return requestClient.post('/tree/local/create', data);
}

export function updateTreeLocal(id: number, data: UpdateTreeLocalParams) {
  return requestClient.put(`/tree/local/update/${id}`, data);
}

export function deleteTreeLocal(id: number) {
  return requestClient.delete(`/tree/local/delete/${id}`);
}

export function connectTerminal(id: number, token: string) {
  return requestClient.get(`/tree/local/terminal/${id}?token=${token}`);
}

export function bindTreeLocal(id: number, data: BindLocalResourceParams) {
  return requestClient.post(`/tree/local/bind/${id}`, data);
}

export function unbindTreeLocal(id: number, data: UnbindLocalResourceParams) {
  return requestClient.post(`/tree/local/unbind/${id}`, data);
}
