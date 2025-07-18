import { requestClientAIOps } from '#/api/request';

/**
 * 自动修复请求接口
 */
export interface AutoFixRequest {
  deployment: string;
  namespace: string;
  event?: string;
  force?: boolean;
}

/**
 * 自动修复响应接口
 */
export interface AutoFixResponse {
  status: string;
  success: boolean;
  result: string;
  deployment: string;
  namespace: string;
  actions_taken: string[];
  timestamp: string;
  error_message?: string;
}

/**
 * 健康检查响应接口
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  components: Record<string, boolean>;
  notification_details?: {
    healthy: boolean;
    channels?: string[];
  };
  system?: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
}

/**
 * 集群诊断响应接口
 */
export interface ClusterDiagnosisResponse {
  diagnosis: string;
  timestamp: string;
  status: string;
}

/**
 * 工作流请求接口
 */
export interface WorkflowRequest {
  problem_description: string;
}

/**
 * 工作流响应接口
 */
export interface WorkflowResponse {
  status: string;
  summary: string;
  workflow_steps?: Array<{
    agent: string;
    reasoning: string;
    action: string;
  }>;
  timestamp: string;
  error?: string;
}

/**
 * 通知请求接口
 */
export interface NotificationRequest {
  type: 'human_help' | 'incident';
  message: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  affected_services?: string[];
}

/**
 * 预测请求接口
 */
export interface PredictionRequest {
  current_qps?: number;
  timestamp?: string;
  include_confidence?: boolean;
}

/**
 * 预测响应接口
 */
export interface PredictionResponse {
  instances: number;
  current_qps: number;
  timestamp: string;
  confidence?: number;
  model_version?: string;
  prediction_type?: string;
  features?: Record<string, any>;
}

/**
 * 趋势预测请求接口
 */
export interface TrendPredictionRequest {
  hours_ahead: number;
  current_qps?: number;
}

/**
 * 趋势预测响应接口
 */
export interface TrendPredictionResponse {
  forecast: Array<{
    timestamp: string;
    instances: number;
    qps: number;
    confidence?: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * 预测服务健康状态接口
 */
export interface PredictionHealthResponse {
  status: string;
  healthy: boolean;
  model_loaded: boolean;
  scaler_loaded: boolean;
  timestamp: string;
  details?: Record<string, any>;
}

/**
 * 根因分析请求接口
 */
export interface RCARequest {
  start_time: string;
  end_time: string;
  metrics: string[];
}

/**
 * 根因分析响应接口
 */
export interface RCAResponse {
  status: string;
  analysis_time: string;
  anomalies: Record<string, {
    avg_score: number;
    count: number;
    detection_methods: Record<string, number | string>;
    first_occurrence: string;
    last_occurrence: string;
    max_score: number;
  }>;
  correlations: Record<string, Array<[string, number]>>;
  metrics_analyzed: string[];
  root_cause_candidates: Array<{
    metric: string;
    confidence: number;
    anomaly_count: number;
    description: string;
    first_occurrence: string;
    related_metrics: string[];
  }>;
  statistics: {
    analysis_duration: number;
    anomalous_metrics: number;
    correlation_pairs: number;
    total_metrics: number;
  };
  summary: string;
  time_range: {
    start: string;
    end: string;
  };
  error?: string;
}

/**
 * 根因分析健康状态接口
 */
export interface RCAHealthResponse {
  status: string;
  components: {
    prometheus: boolean;
    llm: boolean;
    detector: boolean;
    correlator: boolean;
  };
  timestamp: string;
  config: {
    anomaly_threshold: number;
    correlation_threshold: number;
  };
}

/**
 * 可用指标响应接口
 */
export interface MetricsResponse {
  default_metrics: string[];
  categories: Record<string, string[]>;
  config: {
    default_time_range: number;
    max_time_range: number;
    anomaly_threshold: number;
    correlation_threshold: number;
  };
}

/**
 * 事件分析请求接口
 */
export interface IncidentRequest {
  start_time?: string;
  end_time?: string;
  affected_services: string[];
  symptoms: string[];
}

/**
 * 执行自动修复操作
 * @param data 自动修复请求参数
 * @returns 自动修复结果
 */
export async function executeAutoFixApi(data: AutoFixRequest) {
  return requestClientAIOps.post<AutoFixResponse>('/api/v1/autofix', data);
}

/**
 * 执行集群诊断操作
 * @param namespace 命名空间
 * @returns 诊断结果
 */
export async function diagnoseClusterApi(namespace: string) {
  return requestClientAIOps.post<ClusterDiagnosisResponse>(
    '/api/v1/autofix/diagnose',
    {
      namespace,
    },
  );
}

/**
 * 执行自动修复工作流
 * @param data 工作流请求参数
 * @returns 工作流执行结果
 */
export async function executeWorkflowApi(data: WorkflowRequest) {
  return requestClientAIOps.post<WorkflowResponse>(
    '/api/v1/autofix/workflow',
    data,
  );
}

/**
 * 发送通知
 * @param data 通知请求参数
 * @returns 通知发送结果
 */
export async function sendNotificationApi(data: NotificationRequest) {
  return requestClientAIOps.post('/api/v1/autofix/notify', data);
}

/**
 * 获取系统健康状态
 * @returns 健康状态信息
 */
export async function getHealthStatusApi() {
  return requestClientAIOps.get<HealthCheckResponse>('/api/v1/health');
}

/**
 * 获取当前实例预测
 * @param data 预测请求参数
 * @returns 预测结果
 */
export async function getPredictionApi(data?: PredictionRequest) {
  return requestClientAIOps.post<PredictionResponse>(
    '/api/v1/predict',
    data || {},
  );
}

/**
 * 获取趋势预测
 * @param data 趋势预测请求参数
 * @returns 趋势预测结果
 */
export async function getTrendPredictionApi(data: TrendPredictionRequest) {
  return requestClientAIOps.post<TrendPredictionResponse>(
    '/api/v1/predict/trend',
    data,
  );
}

/**
 * 获取预测服务健康状态
 * @returns 预测服务健康状态
 */
export async function getPredictionHealthApi() {
  return requestClientAIOps.get<PredictionHealthResponse>(
    '/api/v1/predict/health',
  );
}

/**
 * 重新加载预测模型
 * @returns 重新加载结果
 */
export async function reloadPredictionModelsApi() {
  return requestClientAIOps.post('/api/v1/predict/models/reload');
}

/**
 * 设置副本数
 * @param deployment 部署名称
 * @param replicas 副本数
 * @param reason 原因
 * @returns 设置结果
 */
export async function setReplicasApi(
  deployment: string,
  replicas: number,
  reason: string = 'manual',
) {
  return requestClientAIOps.post('/api/v1/replicas/set', {
    deployment,
    replicas,
    reason,
  });
}

/**
 * 执行根因分析
 * @param data 根因分析请求参数
 * @returns 根因分析结果
 */
export async function executeRCAApi(data: RCARequest) {
  return requestClientAIOps.post<RCAResponse>('/api/v1/rca', data);
}

/**
 * 获取根因分析健康状态
 * @returns 健康状态信息
 */
export async function getRCAHealthApi() {
  return requestClientAIOps.get<RCAHealthResponse>('/api/v1/rca/health');
}

/**
 * 获取可用监控指标
 * @returns 可用监控指标信息
 */
export async function getAvailableMetricsApi() {
  return requestClientAIOps.get<MetricsResponse>('/api/v1/rca/metrics');
}

/**
 * 获取根因分析配置
 * @returns 根因分析配置
 */
export async function getRCAConfigApi() {
  return requestClientAIOps.get<any>('/api/v1/rca/config');
}

/**
 * 更新根因分析配置
 * @param data 配置信息
 * @returns 更新结果
 */
export async function updateRCAConfigApi(data: {
  anomaly_threshold: number;
  correlation_threshold: number;
}) {
  return requestClientAIOps.put<any>('/api/v1/rca/config', data);
}

/**
 * 分析特定事件
 * @param data 事件参数
 * @returns 分析结果
 */
export async function analyzeIncidentApi(data: IncidentRequest) {
  return requestClientAIOps.post<any>('/api/v1/rca/incident', data);
}
