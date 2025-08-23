import { requestClientAIOps } from '#/api/request';

// 严重程度级别枚举
export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// 数据源类型枚举
export enum DataSourceType {
  METRICS = 'metrics',
  EVENTS = 'events',
  LOGS = 'logs'
}

// 关联分析结果接口
export interface CorrelationResult {
  confidence: number; // 置信度 0-1
  correlation_type: string; // 关联类型
  evidence: string[]; // 证据列表
  timeline: Record<string, any>[]; // 时间线
}

// 根因结果接口
export interface RootCause {
  cause_type: string; // 根因类型
  description: string; // 描述
  confidence: number; // 置信度
  affected_components: string[]; // 受影响组件
  evidence: Record<string, any>; // 证据
  recommendations: string[]; // 建议
}

// 指标数据接口
export interface MetricData {
  name: string; // 指标名称
  values: Record<string, any>[]; // 时间序列值 [{timestamp, value}]
  labels: Record<string, string>; // 标签
  anomaly_score: number; // 异常分数 (0-1)
  trend: string; // 趋势: increasing, decreasing, stable
}

// 事件数据接口
export interface EventData {
  timestamp: string; // 事件时间
  type: string; // 事件类型 (Normal, Warning)
  reason: string; // 事件原因
  message: string; // 事件消息
  involved_object: Record<string, string>; // 涉及的对象
  severity: SeverityLevel; // 严重程度
  count: number; // 事件次数
}

// 日志数据接口
export interface LogData {
  timestamp: string; // 日志时间
  pod_name: string; // Pod名称
  container_name: string; // 容器名称
  level: string; // 日志级别
  message: string; // 日志消息
  error_type?: string; // 错误类型
  stack_trace?: string; // 堆栈跟踪
}

// 根因分析结果接口
export interface RootCauseAnalysis {
  timestamp: string; // 分析时间
  namespace: string; // 命名空间
  root_causes: any[]; // 根因列表
  correlations: any[]; // 关联分析结果
  timeline: Record<string, any>[]; // 事件时间线
  recommendations: string[]; // 建议列表
  confidence_score: number; // 置信度分数
  analysis_metadata: Record<string, any>; // 元数据
}

// 指标数据响应接口
export interface MetricDataResponse {
  name: string;
  values: Record<string, any>[];
  labels: Record<string, string>;
  anomaly_score: number;
  trend: string;
}

// 事件数据响应接口
export interface EventDataResponse {
  timestamp: string;
  type: string;
  reason: string;
  message: string;
  involved_object: Record<string, string>;
  severity: SeverityLevel;
  count: number;
}

// 日志数据响应接口
export interface LogDataResponse {
  timestamp: string;
  pod_name: string;
  container_name: string;
  level: string;
  message: string;
  error_type?: string;
  stack_trace?: string;
}

// 根因分析请求接口
export interface RCAAnalyzeRequest {
  namespace: string; // Kubernetes命名空间
  time_window_hours: number; // 分析时间窗口（小时）
  metrics?: string[]; // 要分析的Prometheus指标列表
}

// 指标查询请求接口
export interface RCAMetricsRequest {
  namespace: string; // Kubernetes命名空间
  start_time?: string; // 开始时间
  end_time?: string; // 结束时间
  metrics?: string; // 逗号分隔的指标名称
}

// 事件查询请求接口
export interface RCAEventsRequest {
  namespace: string; // Kubernetes命名空间
  start_time?: string; // 开始时间
  end_time?: string; // 结束时间
  severity?: string; // 严重程度过滤
}

// 日志查询请求接口
export interface RCALogsRequest {
  namespace: string; // Kubernetes命名空间
  start_time?: string; // 开始时间
  end_time?: string; // 结束时间
  pod_name?: string; // Pod名称
  error_only: boolean; // 只返回错误日志
  max_lines: number; // 最大日志行数
}

// 快速诊断请求接口
export interface RCAQuickDiagnosisRequest {
  namespace: string; // Kubernetes命名空间
}

// 事件模式请求接口
export interface RCAEventPatternsRequest {
  namespace: string; // Kubernetes命名空间
  hours: number; // 分析时间范围（小时）
}

// 错误摘要请求接口
export interface RCAErrorSummaryRequest {
  namespace: string; // Kubernetes命名空间
  hours: number; // 分析时间范围（小时）
}

// 根因分析响应接口
export interface RCAAnalysisResponse {
  namespace: string;
  analysis_id: string;
  timestamp: string;
  time_window_hours: number;
  root_causes: Record<string, any>[];
  anomalies: Record<string, any>;
  correlations: Record<string, any>[];
  recommendations: string[];
  confidence_score: number;
  status: string;
}

// RCA健康检查响应接口
export interface RCAHealthResponse {
  status: string;
  prometheus_connected: boolean;
  kubernetes_connected: boolean;
  redis_connected: boolean;
  last_check_time: string;
  version?: string;
}

// 快速诊断响应接口
export interface QuickDiagnosisResponse {
  namespace: string;
  status: string;
  critical_issues: string[];
  warnings: string[];
  recommendations: string[];
  timestamp: string;
  analysis_duration: number;
}

// 事件模式响应接口
export interface EventPatternsResponse {
  namespace: string;
  time_range_hours: number;
  patterns: Record<string, any>[];
  trending_events: string[];
  anomalous_events: string[];
  timestamp: string;
}

// 错误摘要响应接口
export interface ErrorSummaryResponse {
  namespace: string;
  time_range_hours: number;
  total_errors: number;
  error_categories: Record<string, number>;
  top_errors: Record<string, any>[];
  error_timeline: Record<string, any>[];
  timestamp: string;
}

// 服务配置响应接口
export interface ServiceConfigResponse {
  service: string;
  config: Record<string, any>;
  timestamp: string;
}

// 服务就绪响应接口
export interface ServiceReadyResponse {
  ready: boolean;
  service: string;
  timestamp: string;
  message: string;
}

// 服务信息响应接口
export interface ServiceInfoResponse {
  service: string;
  version: string;
  description: string;
  capabilities: string[];
  endpoints: Record<string, string>;
  constraints: Record<string, any>;
  status: string;
}

// 执行根因分析API
export async function analyzeRootCause(request: RCAAnalyzeRequest): Promise<RCAAnalysisResponse> {
  return requestClientAIOps.post('/rca/analyze', request);
}

// 获取所有可用的Prometheus指标API
export async function getAllPrometheusMetrics() {
  return requestClientAIOps.get('/rca/metrics');
}

// RCA服务健康检查API
export async function getRCAHealth(): Promise<RCAHealthResponse> {
  return requestClientAIOps.get('/rca/health');
}

// RCA服务就绪检查API
export async function getRCAReady(): Promise<ServiceReadyResponse> {
  return requestClientAIOps.get('/rca/ready');
}

// 获取RCA配置API
export async function getRCAConfig(): Promise<ServiceConfigResponse> {
  return requestClientAIOps.get('/rca/config');
}

// 快速诊断API
export async function quickDiagnosis(namespace: string): Promise<QuickDiagnosisResponse> {
  return requestClientAIOps.get('/rca/quick-diagnosis', {
    params: { namespace }
  });
}

// 事件模式分析API
export async function getEventPatterns(namespace: string, hours: number = 1.0): Promise<EventPatternsResponse> {
  return requestClientAIOps.get('/rca/event-patterns', {
    params: { namespace, hours }
  });
}

// 错误摘要API
export async function getErrorSummary(namespace: string, hours: number = 1.0): Promise<ErrorSummaryResponse> {
  return requestClientAIOps.get('/rca/error-summary', {
    params: { namespace, hours }
  });
}

// 获取RCA服务信息API
export async function getRCAInfo(): Promise<ServiceInfoResponse> {
  return requestClientAIOps.get('/rca/info');
}
