import { requestClientAIOps } from '#/api/request';
import type { AssistantMode, APIResponse, OperationResultEntity, HealthEntity } from './common';

// 历史记录列表请求接口
export interface AssistantHistoryListReq {
  page?: number;
  size?: number;
  session_id?: string;
  mode?: string;
  q?: string;
  start?: string;
  end?: string;
}

// 聊天请求接口
export interface AssistantChatReq {
  query: string;
  session_id?: string;
  context?: Record<string, any>;
  mode?: 1 | 2;
}

// 会话创建请求接口
export interface AssistantSessionReq {
  session_id?: string;
}

// 文档创建请求接口
export interface AssistantDocumentReq {
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

// 文档更新请求接口
export interface AssistantDocumentUpdateReq {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

// 知识列表请求接口
export interface AssistantKnowledgeListReq {
  page?: number;
  size?: number;
  title?: string;
}

// 搜索结果
export interface SearchResult {
  title: string;
  content: string;
  relevance_score: number;
  source: string;
  metadata?: Record<string, string | number>;
}

// 助手回答实体
export interface AssistantAnswerEntity {
  answer: string;
  session_id?: string;
  mode?: AssistantMode;
  timestamp: string;
}

// 助手会话实体
export interface AssistantSessionEntity {
  session_id: string;
  timestamp: string;
}

// 助手文档实体
export interface AssistantDocumentEntity {
  title: string;
  content_length: number;
  timestamp: string;
}

// 助手聊天实体
export interface AssistantChatEntity {
  response: string;
  confidence?: number;
}

// 助手搜索结果实体
export interface AssistantSearchResultsEntity {
  results: SearchResult[];
}

// 助手查询实体
export interface AssistantQueryEntity {
  id: number;
  session_id?: string;
  question: string;
  answer?: string;
  mode?: AssistantMode;
  created_at?: string;
  updated_at?: string;
}

// 助手会话数据库实体
export interface AssistantSessionEntityDB {
  id: number;
  session_id: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

// 助手文档数据库实体
export interface AssistantDocumentEntityDB {
  id: number;
  title: string;
  content?: string;
  metadata?: Record<string, string | number | boolean>;
  created_at?: string;
  updated_at?: string;
}

// 历史记录管理
export async function getAssistantHistoryListApi(data: AssistantHistoryListReq): Promise<APIResponse<AssistantQueryEntity[]>> {
  return requestClientAIOps.get('/assistant/history/list', { params: data });
}

export async function getAssistantHistoryDetailApi(id: number): Promise<APIResponse<AssistantQueryEntity>> {
  return requestClientAIOps.get(`/assistant/history/detail/${id}`);
}

export async function deleteAssistantHistoryApi(id: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/assistant/history/delete/${id}`);
}

// 聊天功能
export async function assistantChatApi(data: AssistantChatReq): Promise<APIResponse<AssistantChatEntity>> {
  return requestClientAIOps.post('/assistant/chat', data);
}

// 会话管理
export async function createAssistantSessionApi(data: AssistantSessionReq): Promise<APIResponse<AssistantSessionEntity>> {
  return requestClientAIOps.post('/assistant/session/create', data);
}

// 知识库管理
export async function refreshAssistantKnowledgeApi(): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/assistant/knowledge/refresh');
}

export async function createAssistantKnowledgeApi(data: AssistantDocumentReq): Promise<APIResponse<AssistantDocumentEntity>> {
  return requestClientAIOps.post('/assistant/knowledge/create', data);
}

export async function updateAssistantKnowledgeApi(id: number, data: AssistantDocumentUpdateReq): Promise<APIResponse<AssistantDocumentEntity>> {
  return requestClientAIOps.put(`/assistant/knowledge/update/${id}`, data);
}

export async function getAssistantKnowledgeListApi(data: AssistantKnowledgeListReq): Promise<APIResponse<AssistantDocumentEntityDB[]>> {
  return requestClientAIOps.get('/assistant/knowledge/list', { params: data });
}

export async function getAssistantKnowledgeDetailApi(id: number): Promise<APIResponse<AssistantDocumentEntityDB>> {
  return requestClientAIOps.get(`/assistant/knowledge/detail/${id}`);
}

export async function deleteAssistantKnowledgeApi(id: number): Promise<APIResponse<void>> {
  return requestClientAIOps.delete(`/assistant/knowledge/delete/${id}`);
}

// 文件上传下载
export async function uploadAssistantKnowledgeApi(file: File): Promise<APIResponse<AssistantDocumentEntity>> {
  const formData = new FormData();
  formData.append('file', file);
  return requestClientAIOps.post('/assistant/knowledge/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function downloadAssistantKnowledgeApi(): Promise<APIResponse<Blob>> {
  return requestClientAIOps.get('/assistant/knowledge/download');
}

// 缓存和服务管理
export async function clearAssistantCacheApi(): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/assistant/cache/clear');
}

export async function reinitializeAssistantApi(): Promise<APIResponse<OperationResultEntity>> {
  return requestClientAIOps.post('/assistant/reinitialize');
}

export async function assistantHealthApi(): Promise<APIResponse<HealthEntity>> {
  return requestClientAIOps.get('/assistant/health');
}
