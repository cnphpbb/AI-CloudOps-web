import { requestClient } from '#/api/request';

export interface TemplateDefaultValues {
  fields: Record<string, any>; // 表单字段默认值
  approvers: number[]; // 默认审批人
  priority: number; // 默认优先级
  dueHours?: number; // 默认处理时限(小时)
}

export interface Template {
  name: string; // 模板名称
  description: string; // 模板描述
  processId?: number; // 关联的流程ID
  processName?: string; // 关联的流程名称
  defaultValues: string; // 默认值JSON
  icon: string; // 图标URL
  status: number; // 状态：0-禁用，1-启用
  sortOrder: number; // 排序顺序
  categoryId?: number; // 分类ID
  categoryName?: string; // 分类名称
  creatorId: number; // 创建人ID
  creatorName: string; // 创建人名称
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
  id: number; // 模板ID
}

export interface CreateTemplateReq {
  name: string; // 模板名称
  description?: string; // 模板描述
  processId?: number; // 关联的流程ID
  defaultValues: TemplateDefaultValues; // 默认值
  icon?: string; // 图标URL
  categoryId?: number; // 分类ID
  sortOrder?: number; // 排序顺序
}

export interface UpdateTemplateReq {
  id: number; // 模板ID
  name: string; // 模板名称
  description?: string; // 模板描述
  processId?: number; // 关联的流程ID
  defaultValues: TemplateDefaultValues; // 默认值
  icon?: string; // 图标URL
  categoryId?: number; // 分类ID
  sortOrder?: number; // 排序顺序
  status?: number; // 状态
}

export interface ListTemplateReq {
  page: number;
  size: number;
  search?: string; // 搜索关键词
  categoryId?: number; // 分类ID
  processId?: number; // 关联的流程ID
  status?: number; // 状态：0-禁用，1-启用
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

export async function cloneTemplate(id: number) {
  return requestClient.post(`/workorder/template/clone/${id}`);
}
