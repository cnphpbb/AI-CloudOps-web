import { requestClient } from '#/api/request';

export interface AlertRecordItem {
  id: number;
  name: string;
  pool_id: number;
  pool_name: string;
  ip_address: string;
  port: string;
  enable: boolean;
  for_time: string;
  expr: string;
  labels: string[];
  annotations: string[];
  created_at: string;
  create_user_name: string;
}

export interface GetRecordRulesListParams {
  page?: number;
  size?: number;
  search?: string;
  pool_id?: number;
  enable?: number;
}

export interface createAlertManagerRecordReq {
  name: string;
  pool_id: number;
  ip_address?: string;
  port?: string;
  enable?: boolean;
  for_time?: string;
  expr: string;
  labels?: string[];
  annotations?: string[];
}

export interface updateAlertManagerRecordReq {
  id: number;
  name: string;
  pool_id: number;
  ip_address?: string;
  port?: string;
  enable?: boolean;
  for_time?: string;
  expr: string;
  labels?: string[];
  annotations?: string[];
}

export async function getRecordRulesListApi(data: GetRecordRulesListParams) {
  return requestClient.get('/monitor/record_rules/list', { params: data });
}

export async function createRecordRuleApi(data: createAlertManagerRecordReq) {
  return requestClient.post('/monitor/record_rules/create', data);
}

export async function updateRecordRuleApi(data: updateAlertManagerRecordReq) {
  return requestClient.put(`/monitor/record_rules/update/${data.id}`, data);
}

export async function deleteRecordRuleApi(id: number) {
  return requestClient.delete(`/monitor/record_rules/delete/${id}`);
}

export async function getRecordRuleDetailApi(id: number) {
  return requestClient.get(`/monitor/record_rules/detail/${id}`);
}
