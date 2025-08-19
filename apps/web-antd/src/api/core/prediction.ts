import { requestClientAIOps } from '#/api/request';
import type { PredictionType, APIResponse, OperationResultEntity, HealthEntity, DeletionResultEntity, MetricValue } from './common';

// 预测记录相关接口
export interface ListPredictionRecordsReq {
  page?: number;
  size?: number;
  metric?: string;
  model_version?: string;
  prediction_type?: string;
}

export interface TrendListReq {
  hours_ahead?: number; // 默认24
  current_qps?: number;
  use_prom?: boolean; // 默认false
  metric?: string;
  selector?: string;
  window?: string; // 默认"1m"
}

// 预测调度
export interface PredictionSchedule {
  interval_minutes: number;
  enabled: boolean;
  last_run?: string;
  next_run?: string;
}

// 预测特征
export interface PredictionFeatures {
  cpu_usage?: number;
  memory_usage?: number;
  network_io?: number;
  request_count?: number;
  error_rate?: number;
  response_time?: number;
}

// 模型信息
export interface ModelInfo {
  model_name: string;
  version: string;
  accuracy: number;
  last_trained: string;
  features_used: string[];
  hyperparameters: Record<string, string | number>;
}

// 趋势预测结果
export interface TrendPredictionResult {
  predicted_values: MetricValue[];
  trend_direction: string;
  confidence_interval?: Record<string, number>;
  model_accuracy?: number;
}

// 预测实体
export interface PredictionEntity {
  instances: number;
  current_qps: number;
  timestamp: string;
  confidence?: number;
  model_version?: string;
  prediction_type?: PredictionType;
  features?: PredictionFeatures;
  schedule?: PredictionSchedule;
}

// 趋势预测实体
export interface TrendPredictionEntity {
  result: TrendPredictionResult;
}

// 模型信息实体
export interface ModelInfoEntity {
  info: ModelInfo;
}

// 副本建议实体
export interface ReplicaSuggestionEntity {
  predicted_replicas: number;
  confidence: number;
  average_qps: number;
}

// 预测记录实体
export interface PredictionRecordEntity {
  id: number;
  current_qps?: number;
  input_timestamp?: string;
  use_prom?: boolean;
  metric?: string;
  selector?: string;
  window?: string;
  instances?: number;
  confidence?: number;
  model_version?: string;
  prediction_type?: PredictionType;
  features?: PredictionFeatures;
  schedule_interval_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

// 预测记录管理
export async function listPredictionRecordsApi(data: ListPredictionRecordsReq): Promise<APIResponse<PredictionRecordEntity[]>> {
  return requestClientAIOps.get('/predict/record/list', { params: data });
}

export async function getPredictionRecordDetailApi(recordId: number): Promise<APIResponse<PredictionRecordEntity>> {
  return requestClientAIOps.get(`/predict/record/detail/${recordId}`);
}

export async function deletePredictionRecordApi(recordId: number): Promise<APIResponse<DeletionResultEntity>> {
  return requestClientAIOps.delete(`/predict/record/delete/${recordId}`);
}

// 模型管理
export async function refreshModelApi(): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/predict/model/refresh');
}

export async function listModelsApi(): Promise<APIResponse<ModelInfoEntity[]>> {
  return requestClientAIOps.get('/predict/model/list');
}

export async function getModelDetailApi(modelId: string): Promise<APIResponse<ModelInfoEntity>> {
  return requestClientAIOps.get(`/predict/model/detail/${modelId}`);
}

// 服务管理
export async function reinitializePredictServiceApi(): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/predict/reinitialize');
}

export async function predictHealthApi(): Promise<APIResponse<HealthEntity>> {
  return requestClientAIOps.get('/predict/health');
}

// 趋势预测
export async function getTrendListApi(data: TrendListReq): Promise<APIResponse<TrendPredictionEntity>> {
  return requestClientAIOps.get('/predict/trend/list', { params: data });
}

export async function getTrendDetailApi(trendId: string): Promise<APIResponse<TrendPredictionEntity>> {
  return requestClientAIOps.get(`/predict/trend/detail/${trendId}`);
}
