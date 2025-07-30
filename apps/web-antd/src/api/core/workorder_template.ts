import { requestClient } from '#/api/request';

// 模板默认值结构
export interface TemplateDefaultValues {
  fields: Record<string, any>; // 表单字段默认值
  approvers: number[]; // 默认审批人
  priority: number; // 默认优先级
  due_hours?: number | null; // 默认处理时限(小时)
}

// 模板实体
export interface Template {
  id: number; // 模板ID
  name: string; // 模板名称
  description: string; // 模板描述
  process_id: number; // 关联的流程ID
  default_values: string; // 默认值JSON
  icon: string; // 图标URL
  status: number; // 状态：0-禁用，1-启用
  sort_order: number; // 排序顺序
  category_id?: number | null; // 分类ID
  creator_id: number; // 创建人ID
  creator_name: string; // 创建人名称
  created_at?: string; // 创建时间
  updated_at?: string; // 更新时间
  process?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  category?: {
    id: number;
    name: string;
    description?: string;
  } | null;
}

// 创建模板请求
export interface CreateTemplateReq {
  name: string; // 模板名称
  description?: string; // 模板描述
  process_id: number; // 关联的流程ID
  default_values: TemplateDefaultValues; // 默认值
  icon?: string; // 图标URL
  category_id?: number | null; // 分类ID
  sort_order?: number; // 排序顺序
}

// 更新模板请求
export interface UpdateTemplateReq {
  id: number; // 模板ID
  name: string; // 模板名称
  description?: string; // 模板描述
  process_id: number; // 关联的流程ID
  default_values: TemplateDefaultValues; // 默认值
  icon?: string; // 图标URL
  category_id?: number | null; // 分类ID
  sort_order?: number; // 排序顺序
  status?: number; // 状态
}

// 克隆模板请求
export interface CloneTemplateReq {
  id: number;
  name: string;
}

// 模板列表请求
export interface ListTemplateReq {
  page: number;
  size: number;
  search?: string; // 搜索关键词
  category_id?: number | null; // 分类ID
  process_id?: number | null; // 关联的流程ID
  status?: number | null; // 状态：0-禁用，1-启用
}

export async function createTemplate(data: CreateTemplateReq) {
  return requestClient.post('/workorder/template/create', data);
}

export async function updateTemplate(data: UpdateTemplateReq) {
  return requestClient.put(`/workorder/template/update/${data.id}`, data);
}

export async function deleteTemplate(id: number) {
  return requestClient.delete(`/workorder/template/delete/${id}`);
}

export async function listTemplate(params: ListTemplateReq) {
  return requestClient.get('/workorder/template/list', { params });
}

export async function detailTemplate(id: number) {
  return requestClient.get(`/workorder/template/detail/${id}`);
}

export async function enableTemplate(id: number) {
  return requestClient.put(`/workorder/template/enable/${id}`);
}

export async function disableTemplate(id: number) {
  return requestClient.put(`/workorder/template/disable/${id}`);
}

export async function cloneTemplate(data: CloneTemplateReq) {
  return requestClient.post(`/workorder/template/clone`, data);
}
