import { requestClient } from '#/api/request';

export interface ClustersItem {
  restricted_name_space: string[];
  kube_config_content: string;
  id: number;
  name: string;
  name_zh: string;
  user_id: number;
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  version: string;
  env: string;
  api_server_addr: string;
  action_timeout_seconds: number;
  created_at: string;
}

export interface createClusterReq {
  name: string;
  name_zh: string;
  version: string;
  env: string;
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  restricted_name_space: string; 
  api_server_addr: string;
  kube_config_content: string;
  action_timeout_seconds: number;
}

export interface updateClusterReq {
  id: number;
  name: string;
  name_zh: string;
  version: string;
  env: string;
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  restricted_name_space: string; 
  api_server_addr: string;
  kube_config_content: string;
  action_timeout_seconds: number;
}

export async function getAllClustersApi() {
  return requestClient.get<ClustersItem[]>('/k8s/clusters/list');
}

export async function getClusterApi(id: number) {
  return requestClient.get<ClustersItem>(`/k8s/clusters/${id}`);
}

export async function createClusterApi(data: createClusterReq) {
  return requestClient.post('/k8s/clusters/create', data);
}

export async function updateClusterApi(data: updateClusterReq) {
  return requestClient.post('/k8s/clusters/update', data);
}

export async function deleteClusterApi(id: number) {
  return requestClient.delete(`/k8s/clusters/delete/${id}`);
}

export async function batchDeleteClusterApi(data: number[]) {
  return requestClient.delete('/k8s/clusters/batch_delete', data);
}
