import { requestClientAIOps } from '#/api/request';
import type { RCARecordType, APIResponse, PaginatedListAPIResponse, MetricValue, HealthEntity } from './common';

// RCA记录相关接口
export interface ListRcaRecordsReq {
  page?: number;
  size?: number;
  namespace?: string;
  status?: string;
  search?: string;
  record_type?: string;
  job_id?: string;
}

// RCA分析请求接口
export interface RcaAnalyzeReq {
  start_time?: string;
  end_time?: string;
  metrics?: string[];
  time_range_minutes?: number;
  include_logs?: boolean;
  namespace?: string;
}

// 异常检测请求接口
export interface AnomalyDetectionReq {
  start_time: string;
  end_time: string;
  metrics?: string[];
  sensitivity?: number;
}

// 相关性分析请求接口
export interface CorrelationAnalysisReq {
  start_time: string;
  end_time: string;
  target_metric?: string;
  metrics?: string[];
  namespace?: string;
}

// 跨时滞相关分析请求接口
export interface CrossCorrelationReq {
  start_time: string;
  end_time: string;
  metrics?: string[];
  max_lags?: number;
  namespace?: string;
}

// 时间线创建请求接口
export interface TimelineCreateReq {
  start_time: string;
  end_time: string;
  events?: Record<string, any>[];
}

// 拓扑详情请求接口
export interface TopologyDetailReq {
  namespace?: string;
  source?: string;
  max_hops?: number;
  direction?: string;
}

// 分页列表请求接口
export interface PaginatedListReq {
  page?: number;
  size?: number;
  status?: string;
  namespace?: string;
}

// 拓扑节点
export interface TopologyNode {
  id: string;
  type: string;
  name: string;
  namespace?: string;
  status: string;
  labels?: Record<string, string>;
  metrics?: Record<string, number>;
}

// 拓扑边
export interface TopologyEdge {
  source: string;
  target: string;
  relationship: string;
  weight?: number;
}

// 拓扑图
export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  metadata?: Record<string, string | number>;
}

// 异常点
export interface AnomalyPoint {
  timestamp: string;
  value: number;
  expected_value: number;
  deviation: number;
  severity: string;
  metric_name: string;
}

// 相关性结果
export interface CorrelationResult {
  metric_name: string;
  correlation_coefficient: number;
  p_value: number;
  significance: boolean;
  trend: string;
}

// 时间线事件
export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  description: string;
  severity: string;
  affected_components: string[];
  metadata?: Record<string, string | number>;
}

// RCA结果
export interface RCAResult {
  root_cause: string;
  confidence: number;
  evidence: string[];
  affected_components: string[];
  recommendations: string[];
}

// RCA作业详情
export interface RCAJobDetail {
  job_id: string;
  status: string;
  progress: number;
  start_time: string;
  end_time?: string;
  results?: RCAResult;
}

// 异常检测结果
export interface AnomalyDetectionResult {
  anomalies: AnomalyPoint[];
  detection_period: Record<string, string>;
  sensitivity?: number;
}

// 相关性分析结果
export interface CorrelationAnalysisResult {
  target_metric?: string;
  correlations: CorrelationResult[];
  analysis_period: Record<string, string>;
}

// 时间线结果
export interface TimelineResult {
  timeline: TimelineEvent[];
  period: Record<string, string>;
}

// RCA结果实体
export interface RCAResultEntity {
  result: RCAResult;
}

// RCA作业实体
export interface RCAJobEntity {
  job_id: string;
  flags?: Record<string, string | number | boolean>;
}

// RCA作业详情实体
export interface RCAJobDetailEntity {
  data: RCAJobDetail;
}

// RCA指标实体
export interface RCAMetricsEntity {
  default_metrics: string[];
  available_metrics: string[];
  flags?: Record<string, string | number | boolean>;
}

// 拓扑快照实体
export interface TopologySnapshotEntity {
  namespace?: string;
  counts: Record<string, number>;
  topology: TopologyGraph;
  impact_scope?: string[];
  flags?: Record<string, string | number | boolean>;
}

// 异常检测实体
export interface AnomalyDetectionEntity {
  anomalies: AnomalyDetectionResult;
  detection_period: Record<string, string>;
  sensitivity?: number;
}

// 相关性分析实体
export interface CorrelationAnalysisEntity {
  target_metric?: string;
  correlations: CorrelationAnalysisResult;
  analysis_period: Record<string, string>;
}

// 时间线实体
export interface TimelineEntity {
  timeline: TimelineResult;
  period: Record<string, string>;
}

// RCA记录实体
export interface RCARecordEntity {
  id: number;
  start_time: string;
  end_time: string;
  metrics?: string;
  namespace?: string;
  status?: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
  record_type?: RCARecordType;
  job_id?: string;
  params?: Record<string, string | number | boolean>;
  result?: RCAResult;
  error?: string;
}

// RCA记录管理
export async function listRcaRecordsApi(data: ListRcaRecordsReq): Promise<PaginatedListAPIResponse<RCARecordEntity>> {
  return requestClientAIOps.get('/rca/records/list', { params: data });
}

export async function getRcaRecordDetailApi(recordId: number): Promise<APIResponse<RCARecordEntity>> {
  return requestClientAIOps.get(`/rca/records/detail/${recordId}`);
}

export async function deleteRcaRecordApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/rca/records/delete/${recordId}`);
}

// RCA分析
export async function createRcaAnalysisApi(data: RcaAnalyzeReq): Promise<APIResponse<RCAJobEntity>> {
  return requestClientAIOps.post('/rca/analyses/create', data);
}

export async function listRcaAnalysesApi(data: PaginatedListReq): Promise<PaginatedListAPIResponse<RCAJobDetail>> {
  return requestClientAIOps.get('/rca/analyses/list', { params: data });
}

export async function getRcaAnalysisDetailApi(jobId: string): Promise<APIResponse<RCAJobDetailEntity>> {
  return requestClientAIOps.get(`/rca/analyses/detail/${jobId}`);
}

export async function deleteRcaAnalysisApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/rca/analyses/delete/${recordId}`);
}

// 指标管理
export async function listAvailableMetricsApi(): Promise<APIResponse<RCAMetricsEntity>> {
  return requestClientAIOps.get('/rca/metrics/list');
}

// 拓扑管理
export async function getTopologyDetailApi(data: TopologyDetailReq): Promise<APIResponse<TopologySnapshotEntity>> {
  return requestClientAIOps.get('/rca/topology/detail', { params: data });
}

// 异常检测
export async function createAnomalyDetectionApi(data: AnomalyDetectionReq): Promise<APIResponse<AnomalyDetectionEntity>> {
  return requestClientAIOps.post('/rca/anomalies/create', data);
}

// 相关性分析
export async function createCorrelationAnalysisApi(data: CorrelationAnalysisReq): Promise<APIResponse<RCAJobEntity>> {
  return requestClientAIOps.post('/rca/correlations/create', data);
}

export async function listCorrelationJobsApi(data: PaginatedListReq): Promise<PaginatedListAPIResponse<RCAJobDetail>> {
  return requestClientAIOps.get('/rca/correlations/list', { params: data });
}

export async function getCorrelationDetailApi(jobId: string): Promise<APIResponse<CorrelationAnalysisEntity>> {
  return requestClientAIOps.get(`/rca/correlations/detail/${jobId}`);
}

export async function deleteCorrelationRecordApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/rca/correlations/delete/${recordId}`);
}

// 跨时滞相关分析
export async function createCrossCorrelationApi(data: CrossCorrelationReq): Promise<APIResponse<RCAJobEntity>> {
  return requestClientAIOps.post('/rca/cross-correlations/create', data);
}

export async function listCrossCorrelationJobsApi(data: PaginatedListReq): Promise<PaginatedListAPIResponse<RCAJobDetail>> {
  return requestClientAIOps.get('/rca/cross-correlations/list', { params: data });
}

export async function getCrossCorrelationDetailApi(jobId: string): Promise<APIResponse<CorrelationAnalysisEntity>> {
  return requestClientAIOps.get(`/rca/cross-correlations/detail/${jobId}`);
}

export async function deleteCrossCorrelationRecordApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/rca/cross-correlations/delete/${recordId}`);
}

// 时间线管理
export async function createTimelineApi(data: TimelineCreateReq): Promise<APIResponse<RCAJobEntity>> {
  return requestClientAIOps.post('/rca/timelines/create', data);
}

export async function listTimelinesApi(data: PaginatedListReq): Promise<PaginatedListAPIResponse<RCAJobDetail>> {
  return requestClientAIOps.get('/rca/timelines/list', { params: data });
}

export async function getTimelineDetailApi(recordId: string): Promise<APIResponse<TimelineEntity>> {
  return requestClientAIOps.get(`/rca/timelines/detail/${recordId}`);
}

export async function deleteTimelineRecordApi(recordId: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/rca/timelines/delete/${recordId}`);
}

// 健康检查
export async function rcaHealthApi(): Promise<APIResponse<HealthEntity>> {
  return requestClientAIOps.get('/rca/health/detail');
}
