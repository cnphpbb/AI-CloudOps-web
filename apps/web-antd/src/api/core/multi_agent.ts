import { requestClientAIOps } from '#/api/request';
import type { WorkflowStatus, APIResponse, RemediationConfig, HealthEntity, OperationResultEntity } from './common';

// 单个部署修复请求接口
export interface MultiAgentRepairReq {
  deployment: string;
  namespace?: string;
}

// 批量部署修复请求接口
export interface MultiAgentRepairAllReq {
  namespace?: string;
}

// 集群分析请求接口
export interface MultiAgentClusterReq {
  cluster_name?: string;
}

// 多智能体任务执行请求接口
export interface MultiAgentExecuteReq {
  task_type: string;
  priority?: string;
  parameters?: Record<string, any>;
  task_id?: string;
  status?: string;
}

// 智能体列表请求接口
export interface MultiAgentListReq {
  page?: number;
  size?: number;
  search?: string;
}

// 工作流记录列表请求接口
export interface WorkflowRecordsListReq {
  page?: number;
  size?: number;
  namespace?: string;
  status?: string;
  search?: string;
}

// 工作流记录创建请求接口
export interface WorkflowRecordCreateReq {
  workflow_id: string;
  status: string;
  namespace?: string;
  target?: string;
  details?: Record<string, any>;
}

// 工作流记录更新请求接口
export interface WorkflowRecordUpdateReq {
  workflow_id?: string;
  status?: string;
  namespace?: string;
  target?: string;
  details?: Record<string, any>;
}

// 代理状态
export interface AgentStatus {
  agent_id: string;
  agent_type: string;
  status: string;
  last_heartbeat: string;
  capabilities: string[];
  current_task?: string;
  performance_metrics?: Record<string, number>;
}

// 工作流实体
export interface WorkflowEntity {
  workflow_id: string;
  status: WorkflowStatus;
}

// 多代理指标实体
export interface MultiAgentMetricsEntity {
  total_workflows: number;
  successful_workflows: number;
  rolled_back: number;
  avg_success_rate: number;
  config: RemediationConfig;
  timestamp: string;
}

// 协调器状态实体
export interface CoordinatorStatusEntity {
  healthy: boolean;
  components?: Record<string, boolean>;
  timestamp?: string;
  service?: string;
}

// 多代理状态实体
export interface MultiAgentStatusEntity {
  agents: AgentStatus[];
}

// 工作流记录实体
export interface WorkflowRecordEntity {
  id: number;
  workflow_id: string;
  status: WorkflowStatus;
  namespace?: string;
  target?: string;
  details?: Record<string, string | number | boolean | string[]>;
  created_at?: string;
  updated_at?: string;
}

// 指标管理
export async function getMultiAgentMetricsApi(): Promise<APIResponse<MultiAgentMetricsEntity>> {
  return requestClientAIOps.get('/multi-agent/metrics/detail');
}

// 修复任务管理
export async function createDeploymentRepairApi(data: MultiAgentRepairReq): Promise<APIResponse<WorkflowEntity>> {
  return requestClientAIOps.post('/multi-agent/repairs/create', data);
}

export async function createAllRepairsApi(data: MultiAgentRepairAllReq): Promise<APIResponse<WorkflowEntity[]>> {
  return requestClientAIOps.post('/multi-agent/repairs/create-all', data);
}

// 集群分析
export async function createClusterAnalysisApi(data: MultiAgentClusterReq): Promise<APIResponse<WorkflowEntity>> {
  return requestClientAIOps.post('/multi-agent/analysis/create', data);
}

// 协调器状态管理
export async function getCoordinatorStatusApi(): Promise<APIResponse<CoordinatorStatusEntity>> {
  return requestClientAIOps.get('/multi-agent/coordinator/status/detail');
}

// 智能体管理
export async function listAgentsApi(data: MultiAgentListReq): Promise<APIResponse<AgentStatus[]>> {
  return requestClientAIOps.get('/multi-agent/agents/list', { params: data });
}

// 系统状态管理
export async function multiAgentHealthApi(): Promise<APIResponse<HealthEntity>> {
  return requestClientAIOps.get('/multi-agent/health/detail');
}

export async function getMultiAgentStatusApi(): Promise<APIResponse<MultiAgentStatusEntity>> {
  return requestClientAIOps.get('/multi-agent/status/detail');
}

// 任务执行
export async function multiAgentExecuteApi(data: MultiAgentExecuteReq): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/multi-agent/execute', data);
}

// 协调详情
export async function getMultiAgentCoordinationApi(): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.get('/multi-agent/coordination/detail');
}

// 工作流记录管理
export async function listWorkflowRecordsApi(data: WorkflowRecordsListReq): Promise<APIResponse<WorkflowRecordEntity[]>> {
  return requestClientAIOps.get('/multi-agent/workflows/list', { params: data });
}

export async function createWorkflowRecordApi(data: WorkflowRecordCreateReq): Promise<APIResponse<WorkflowRecordEntity>> {
  return requestClientAIOps.post('/multi-agent/workflows/create', data);
}

export async function getWorkflowRecordApi(recordId: number): Promise<APIResponse<WorkflowRecordEntity>> {
  return requestClientAIOps.get(`/multi-agent/workflows/detail/${recordId}`);
}

export async function updateWorkflowRecordApi(recordId: number, data: WorkflowRecordUpdateReq): Promise<APIResponse<WorkflowRecordEntity>> {
  return requestClientAIOps.put(`/multi-agent/workflows/update/${recordId}`, data);
}

export async function deleteWorkflowRecordApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/multi-agent/workflows/delete/${recordId}`);
}
