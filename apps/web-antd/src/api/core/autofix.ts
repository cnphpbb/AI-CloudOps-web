import { requestClientAIOps } from '#/api/request';
import type { AutofixStatus, APIResponse, OperationResultEntity, HealthEntity } from './common';

// 诊断请求接口
export interface DiagnoseReq {
  namespace?: string;
  deployment?: string;
}

// 修复请求接口
export interface FixReq {
  namespace?: string;
  deployment: string;
  issues?: string[];
  auto_approve?: boolean;
}

// 工作流请求接口
export interface WorkflowReq {
  workflow_type?: string;
  namespace?: string;
  target?: string;
}

// 创建自动修复任务接口
export interface CreateAutofixReq {
  deployment: string;
  namespace?: string;
  event: string;
  force?: boolean;
  auto_restart?: boolean;
}

// 修复历史列表请求接口
export interface FixHistoryListReq {
  page?: number;
  size?: number;
  search?: string;
  namespace?: string;
  status?: string;
  start?: string;
  end?: string;
}

// 修复记录列表请求接口
export interface AutofixRecordsListReq {
  page?: number;
  size?: number;
  namespace?: string;
  status?: string;
  search?: string;
}

// 创建修复记录请求接口
export interface CreateAutofixRecordReq {
  deployment: string;
  namespace?: string;
  status?: string;
  actions?: string;
  error_message?: string;
}

// 更新修复记录请求接口
export interface UpdateAutofixRecordReq {
  deployment?: string;
  namespace?: string;
  status?: string;
  actions?: string;
  error_message?: string;
}

// 通知请求接口
export interface NotifyReq {
  webhook_url?: string;
  message?: string;
}

// 自动修复动作
export interface AutofixAction {
  action_type: string;
  target: string;
  parameters: Record<string, string | number | boolean>;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

// 问题详情
export interface IssueDetail {
  issue_type: string;
  severity: string;
  description: string;
  affected_resources: string[];
  suggested_fixes: string[];
  timestamp: string;
}

// 自动修复实体
export interface AutoFixEntity {
  status: AutofixStatus;
  result: string;
  deployment: string;
  namespace: string;
  actions_taken: AutofixAction[];
  timestamp: string;
  success: boolean;
  error_message?: string;
}

// 自动修复诊断实体
export interface AutofixDiagnoseEntity {
  namespace: string;
  issues: IssueDetail[];
}

// 自动修复动作结果实体
export interface AutofixActionResultEntity {
  namespace: string;
  deployment: string;
  status: AutofixStatus;
}

// 自动修复记录实体
export interface AutoFixRecordEntity {
  id: number;
  deployment: string;
  namespace: string;
  status?: AutofixStatus;
  actions?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

// 通知发送结果实体
export interface NotificationSendResultEntity {
  sent: boolean;
}

// 诊断和修复
export async function diagnoseKubernetesApi(data: DiagnoseReq): Promise<APIResponse<AutofixDiagnoseEntity>> {
  return requestClientAIOps.post('/autofix/diagnose', data);
}

export async function fixKubernetesApi(data: FixReq): Promise<APIResponse<AutoFixEntity>> {
  return requestClientAIOps.post('/autofix/fix', data);
}

export async function executeWorkflowApi(data: WorkflowReq): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/autofix/workflow', data);
}

// 自动修复任务管理
export async function createAutofixApi(data: CreateAutofixReq): Promise<APIResponse<AutoFixEntity>> {
  return requestClientAIOps.post('/autofix/create', data);
}

// 修复历史管理
export async function getFixHistoryListApi(data: FixHistoryListReq): Promise<APIResponse<AutoFixRecordEntity[]>> {
  return requestClientAIOps.get('/autofix/history/list', { params: data });
}

// 修复记录管理
export async function getAutofixRecordDetailApi(recordId: number): Promise<APIResponse<AutoFixRecordEntity>> {
  return requestClientAIOps.get(`/autofix/records/detail/${recordId}`);
}

export async function deleteAutofixRecordApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/autofix/records/delete/${recordId}`);
}

export async function listAutofixRecordsApi(data: AutofixRecordsListReq): Promise<APIResponse<AutoFixRecordEntity[]>> {
  return requestClientAIOps.get('/autofix/records/list', { params: data });
}

export async function createAutofixRecordApi(data: CreateAutofixRecordReq): Promise<APIResponse<AutoFixRecordEntity>> {
  return requestClientAIOps.post('/autofix/records/create', data);
}

export async function getAutofixRecordDbApi(recordId: number): Promise<APIResponse<AutoFixRecordEntity>> {
  return requestClientAIOps.get(`/autofix/records/detail/db/${recordId}`);
}

export async function updateAutofixRecordApi(recordId: number, data: UpdateAutofixRecordReq): Promise<APIResponse<AutoFixRecordEntity>> {
  return requestClientAIOps.put(`/autofix/records/update/${recordId}`, data);
}

export async function deleteAutofixRecordDbApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/autofix/records/delete/db/${recordId}`);
}

// 通知
export async function sendNotifyApi(data: NotifyReq): Promise<APIResponse<NotificationSendResultEntity>> {
  return requestClientAIOps.post('/autofix/notify/create', data);
}

// 健康检查
export async function autofixHealthApi(): Promise<APIResponse<HealthEntity>> {
  return requestClientAIOps.get('/autofix/health/detail');
}
