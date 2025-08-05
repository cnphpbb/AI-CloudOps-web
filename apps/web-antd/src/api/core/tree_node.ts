import { requestClient } from '#/api/request';

// 云服务提供商类型
export type CloudProvider = 'ecs' | 'elb' | 'rds' | 'local';

// 用户类型接口
export interface User {
  id: number;
  username: string;
  email?: string;
  real_name: string;
  mobile: string;
  fei_shu_user_id: string;
  account_type: number;
  home_path: string;
  enable: number;
}

// 树节点基本信息
export interface TreeNode {
  id: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  parentId: number;
  level: number;
  description: string;
  creator_id: number; // 修正：与后端字段名保持一致
  status: string;
  admins: User[]; // 修正：字段名与后端一致
  members: User[]; // 修正：字段名与后端一致
  isLeaf: boolean;
  // 非数据库字段
  child_count: number; // 修正：使用下划线命名
  resource_count: number; // 修正：使用下划线命名
  parent_name: string; // 修正：使用下划线命名
  creator_name: string;
  children: TreeNode[];
}

// 树节点资源关联表
export interface TreeNodeResource {
  id: number;
  created_at: string;
  updated_at: string;
  tree_node_id: number; 
  resource_id: string; 
  resource_type: CloudProvider; 
}

// 资源项目
export interface ResourceItems {
  resource_name: string;
  resource_type: CloudProvider;
  status: string;
  created_at: string;
}

// 树统计信息响应
export interface TreeNodeStatisticsResp {
  total_nodes: number; 
  total_resources: number;
  total_admins: number;
  total_members: number;
  active_nodes: number;
  inactive_nodes: number;
}

export interface NodeResourceInfo {
  id: number;
  resource_id: string;
  resource_type: string;
  resource_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface GetTreeNodeListReq {
  level?: number;
  status?: 'active' | 'inactive' | 'deleted';
}

export interface GetTreeNodeDetailReq {
  id: number;
}

export interface GetTreeNodeChildNodesReq {
  id: number;
}

export interface CreateTreeNodeReq {
  name: string;
  parent_id?: number;
  creator_id?: number;
  description?: string;
  is_leaf?: boolean;
  status?: 'active' | 'inactive';
}

export interface UpdateTreeNodeReq {
  id: number;
  name: string;
  parent_id?: number;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateTreeNodeStatusReq {
  id: number;
  status: 'active' | 'inactive';
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
  type?: 'admin' | 'member';
}

export interface AddTreeNodeMemberReq {
  node_id: number;
  user_id: number;
  member_type: 'admin' | 'member';
}

export interface RemoveTreeNodeMemberReq {
  node_id: number;
  user_id: number;
  member_type: 'admin' | 'member';
}

export interface GetTreeNodeResourcesReq {
  id: number;
}

export interface BindTreeNodeResourceReq {
  node_id: number;
  resource_type?: CloudProvider;
  resource_ids: string[];
}

export interface UnbindTreeNodeResourceReq {
  node_id: number;
  resource_id: string;
  resource_type: CloudProvider;
}

export interface CheckTreeNodePermissionReq {
  user_id: number;
  node_id: number;
  operation: string;
}

export interface GetUserTreeNodesReq {
  user_id: number;
  role?: 'admin' | 'member';
}

export async function getTreeList(params?: GetTreeNodeListReq) {
  return requestClient.get('/tree/node/list', { params });
}

export async function getNodeDetail(id: number) {
  return requestClient.get(`/tree/node/detail/${id}`);
}

export async function getChildNodes(id: number) {
  return requestClient.get(`/tree/node/children/${id}`);
}

export async function getTreeStatistics() {
  return requestClient.get('/tree/node/statistics');
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

export async function updateNodeStatus(id: number, data: UpdateTreeNodeStatusReq) {
  return requestClient.put(`/tree/node/status/${id}`, data);
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

export async function getNodeResources(id: number) {
  return requestClient.get(`/tree/node/resources/${id}`);
}

export async function bindResource(data: BindTreeNodeResourceReq) {
  return requestClient.post('/tree/node/resource/bind', data);
}

export async function unbindResource(data: UnbindTreeNodeResourceReq) {
  return requestClient.delete('/tree/node/resource/unbind', { data });
}
