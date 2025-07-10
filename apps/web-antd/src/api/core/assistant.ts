import { requestClientAIOps } from '#/api/request';

// 健康检查响应接口
export interface HealthCheckResponse {
  code: number;
  message: string;
  data: {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    components: Record<string, boolean>;
  };
}

// 创建会话响应接口
export interface CreateSessionResponse {
  code: number;
  message: string;
  data: {
    session_id: string;
  };
}

// 智能小助手查询请求接口
export interface AssistantQueryRequest {
  question: string;
  session_id?: string;
  use_web_search?: boolean;
  max_context_docs?: number;
}

// 智能小助手查询响应接口
export interface AssistantQueryResponse {
  code: number;
  message: string;
  data: {
    answer: string;
    sources?: Array<{
      title?: string;
      url?: string;
      content?: string;
    }>;
    session_id: string;
  };
}

// 刷新知识库响应接口
export interface RefreshKnowledgeBaseResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
    documents_count?: number;
  };
}

// 添加文档到知识库请求接口
export interface AddDocumentRequest {
  content: string;
  metadata?: {
    source?: string;
    author?: string;
    [key: string]: any;
  };
}

// 添加文档到知识库响应接口
export interface AddDocumentResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
    document_id?: string;
  };
}

// 清除缓存响应接口
export interface ClearCacheResponse {
  code: number;
  message: string;
  data: {
    success: boolean;
  };
}

// 健康检查接口
export const getHealthCheck = () => {
  return requestClientAIOps.get('/api/v1/health');
};

// 创建会话接口
export const createAssistantSession = () => {
  return requestClientAIOps.post('/api/v1/assistant/session');
};

// 智能小助手查询接口
export const queryAssistant = (params: AssistantQueryRequest) => {
  return requestClientAIOps.post('/api/v1/assistant/query', params);
};

// 刷新知识库接口
export const refreshKnowledgeBase = () => {
  return requestClientAIOps.post('/api/v1/assistant/refresh');
};

// 添加文档到知识库接口
export const addDocumentToKnowledgeBase = (params: AddDocumentRequest) => {
  return requestClientAIOps.post('/api/v1/assistant/add-document', params);
};

// 清除缓存接口
export const clearAssistantCache = () => {
  return requestClientAIOps.post('/api/v1/assistant/clear-cache');
};
