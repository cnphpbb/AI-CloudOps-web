import { requestClient } from '#/api/request';
import { ResourceStatus } from './tree_local';

export enum TreeNodeStatus {
  ACTIVE = 1,
  INACTIVE = 2,
}

export enum TreeNodeMemberType {
  AdminRole = 1,
  MemberRole = 2,
}

export interface User {
  id: number;
  real_name: string;
  email: string;
  username: string;
}

export interface TreeLocalResource {
  id: number;
  name: string;
  ip_addr: string;
  port: number;
  status: ResourceStatus;
}

export interface TreeNode {
  id: number;
  name: string;
  parent_id: number;
  level: number;
  description: string;
  create_user_id: number;
  create_user_name: string;
  status: TreeNodeStatus;
  admins: User[];
  members: User[];
  is_leaf: 1 | 2;
  children?: TreeNode[];
  tree_local_resources: TreeLocalResource[];
  created_at: string;
  updated_at: string;
}

export interface GetTreeNodeListReq {
  level?: number;
  status?: TreeNodeStatus;
}

export interface GetTreeNodeDetailReq {
  id: number;
}

export interface CreateTreeNodeReq {
  name: string;
  parent_id?: number;
  description?: string;
  is_leaf?: number;
  status?: TreeNodeStatus;
}

export interface UpdateTreeNodeReq {
  id: number;
  name: string;
  parent_id?: number;
  description?: string;
  status?: TreeNodeStatus;
}

export interface DeleteTreeNodeReq {
  id: number;
}

export interface MoveTreeNodeReq {
  id: number;
  new_parent_id: number;
}

export interface GetTreeNodeMembersReq {
  id: number;
  type?: TreeNodeMemberType;
}

export interface AddTreeNodeMemberReq {
  node_id: number;
  user_id: number;
  member_type: TreeNodeMemberType;
}

export interface RemoveTreeNodeMemberReq {
  node_id: number;
  user_id: number;
  member_type: TreeNodeMemberType;
}

export interface BindTreeNodeResourceReq {
  node_id: number;
  resource_ids: number[];
}

export interface UnbindTreeNodeResourceReq {
  node_id: number;
  resource_id: number;
}

export interface GetUserTreeNodesReq {
  user_id: number;
  role?: TreeNodeMemberType;
}

export async function getTreeList(params?: GetTreeNodeListReq) {
  return requestClient.get('/tree/node/list', { params });
}

export async function getNodeDetail(id: number) {
  return requestClient.get(`/tree/node/detail/${id}`);
}

export async function createNode(data: CreateTreeNodeReq) {
  return requestClient.post('/tree/node/create', data);
}

export async function updateNode(id: number, data: UpdateTreeNodeReq) {
  return requestClient.put(`/tree/node/update/${id}`, data);
}

export async function deleteNode(id: number) {
  return requestClient.delete(`/tree/node/delete/${id}`);
}

export async function moveNode(id: number, data: MoveTreeNodeReq) {
  return requestClient.put(`/tree/node/move/${id}`, data);
}

export async function getNodeMembers(id: number, params?: GetTreeNodeMembersReq) {
  return requestClient.get(`/tree/node/members/${id}`, { params });
}

export async function addNodeMember(data: AddTreeNodeMemberReq) {
  return requestClient.post('/tree/node/member/add', data);
}

export async function removeNodeMember(data: RemoveTreeNodeMemberReq) {
  return requestClient.delete(`/tree/node/member/remove/${data.node_id}`, {
    data: data,
  });
}

export async function bindResource(data: BindTreeNodeResourceReq) {
  return requestClient.post('/tree/node/resource/bind', data);
}

export async function unbindResource(data: UnbindTreeNodeResourceReq) {
  return requestClient.post('/tree/node/resource/unbind', data);
}
