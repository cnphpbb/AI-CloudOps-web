import { requestClientAIOps } from '#/api/request';

// 枚举类型
export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
export type PredictionType = 'qps' | 'cpu' | 'memory' | 'replicas' | 'custom';
export type AutofixStatus = 'success' | 'failed' | 'in_progress' | 'rolled_back';
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type RCARecordType = 'anomaly_detection' | 'correlation_analysis' | 'topology_analysis' | 'timeline_analysis';
export type AssistantMode = 'chat' | 'search' | 'document';

// 通用API响应格式
export interface APIResponse<T = any> {
  code: number; // 默认0
  message: string; // 默认""
  data?: T;
}

// 分页列表API响应格式
export interface PaginatedListAPIResponse<T = any> {
  code: number; // 默认0
  message: string; // 默认""
  items?: T[];
  total: number; // 默认0
}

// HTTP验证错误
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// 系统信息
export interface SystemInfo {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_io?: Record<string, number>;
  load_average?: number[];
}

// 组件状态
export interface ComponentStatus {
  name: string;
  status: boolean;
  last_check?: string;
  error_message?: string;
}

// 指标值
export interface MetricValue {
  value: number;
  timestamp: string;
  labels?: Record<string, string>;
}

// 通知配置
export interface NotificationConfig {
  webhook_url?: string;
  email_recipients?: string[];
  slack_channel?: string;
  enabled?: boolean; // 默认true
}

// 修复配置
export interface RemediationConfig {
  auto_fix_enabled?: boolean; // 默认true
  max_retries?: number; // 默认3
  rollback_threshold?: number; // 默认0.8
  notification_config?: NotificationConfig;
  allowed_actions?: string[];
}

// 操作结果实体
export interface OperationResultEntity {
  message?: string;
  timestamp: string;
  success: boolean;
  details?: Record<string, string | number | boolean | string[]>;
}

// 健康状态实体
export interface HealthEntity {
  status: HealthStatus;
  timestamp: string;
  uptime?: number;
  version?: string;
  components?: Record<string, boolean>;
  system?: SystemInfo;
}

// 删除结果实体
export interface DeletionResultEntity {
  id: number;
}

// 健康快照记录实体
export interface HealthSnapshotRecordEntity {
  id: number;
  status: HealthStatus;
  components?: Record<string, boolean>;
  system?: SystemInfo;
  version?: string;
  uptime?: number;
  created_at?: string;
  updated_at?: string;
}

// 根路径
export async function getRootApi() {
  return requestClientAIOps.get('/');
}
