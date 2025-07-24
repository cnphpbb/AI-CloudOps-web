import { requestClient } from '#/api/request';

// 监控告警规则相关接口类型定义

// 告警规则项
export interface MonitorAlertRuleItem {
  id: number;
  name: string;
  user_id: number;
  pool_id: number;
  send_group_id: number;
  ip_address: string;
  enable: number;
  expr: string;
  severity: string;
  grafana_link: string;
  for_time: string;
  labels: string[];
  annotations: string[];
  created_at: string;
  updated_at: string;
  create_user_name: string;
  pool_name: string;
  send_group_name: string;
}

// 获取告警规则列表参数
export interface GetAlertRuleListParams {
  page?: number;
  size?: number;
  pool_id?: number;
  enable?: number;
  search?: string;
  severity?: string;
  send_group_id?: number;
}

// 创建告警规则请求参数
export interface createAlertRuleReq {
  name: string;
  pool_id: number;
  send_group_id: number;
  ip_address?: string;
  enable?: number;
  expr: string;
  severity: string;
  grafana_link?: string;
  for_time: string;
  labels?: string[];
  annotations?: string[];
}

// 更新告警规则请求参数
export interface updateAlertRuleReq {
  id: number;
  name: string;
  pool_id: number;
  send_group_id: number;
  ip_address?: string;
  enable?: number;
  expr: string;
  severity: string;
  grafana_link?: string;
  for_time: string;
  labels?: string[];
  annotations?: string[];
}

// 表达式验证请求参数
export interface validateExprApiReq {
  promql_expr: string;
}

export async function getMonitorAlertRuleListApi(data: GetAlertRuleListParams) {
  return requestClient.get('/monitor/alert_rules/list', { params: data });
}

export async function createAlertRuleApi(data: createAlertRuleReq) {
  return requestClient.post('/monitor/alert_rules/create', data);
}

export async function updateAlertRuleApi(data: updateAlertRuleReq) {
  return requestClient.put(`/monitor/alert_rules/update/${data.id}`, data);
}

export async function deleteAlertRuleApi(id: number) {
  return requestClient.delete(`/monitor/alert_rules/delete/${id}`);
}

export async function getAlertRuleDetailApi(id: number) {
  return requestClient.get(`/monitor/alert_rules/detail/${id}`);
}

export async function validateExprApi(data: validateExprApiReq) {
  return requestClient.post('/monitor/alert_rules/promql_check', data);
}
