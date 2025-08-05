import { requestClient } from '#/api/request';
import type { WorkorderCategoryItem } from './workorder_category';
import type { WorkorderFormDesignItem } from './workorder_form_design';

// 流程状态常量
export const ProcessStatus = {
  Draft: 1, // 草稿
  Published: 2, // 已发布
  Archived: 3, // 已归档
} as const;

// 流程步骤类型常量
export const ProcessStepType = {
  Start: 'start', // 开始
  Approval: 'approval', // 审批
  Task: 'task', // 任务
  End: 'end', // 结束
} as const;

// 可执行动作常量
export const Action = {
  Start: 'start', // 开始动作
  Approve: 'approve', // 审批动作
  Reject: 'reject', // 驳回动作
  Complete: 'complete', // 完成动作
  Notify: 'notify', // 通知动作
} as const;

// 受理人类型常量
export const AssigneeType = {
  User: 'user', // 用户类型
  Group: 'system', // 系统类型
} as const;

// WorkorderProcess 工单流程实体
export interface WorkorderProcessItem {
  id?: number; // 流程ID
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  name: string; // 流程名称
  description?: string; // 流程描述
  form_design_id: number; // 关联表单设计ID
  definition: any; // 流程JSON定义
  status: number; // 状态
  category_id?: number; // 分类ID
  operator_id: number; // 操作人ID
  operator_name: string; // 操作人名称
  tags?: string[]; // 标签
  is_default: number; // 是否为默认流程
  category?: WorkorderCategoryItem; // 分类
  form_design?: WorkorderFormDesignItem; // 表单设计
}

// 创建工单流程请求
export interface CreateWorkorderProcessReq {
  name: string; // 流程名称
  description?: string; // 流程描述
  form_design_id: number; // 关联表单设计ID
  definition: any; // 流程定义
  status: number; // 状态
  category_id?: number; // 分类ID
  tags?: string[]; // 标签
  is_default: number; // 是否为默认流程
}

// 更新工单流程请求
export interface UpdateWorkorderProcessReq {
  id: number; // 流程ID
  name: string; // 流程名称
  description?: string; // 流程描述
  form_design_id: number; // 关联表单设计ID
  definition: any; // 流程定义
  status: number; // 状态
  category_id?: number; // 分类ID
  tags?: string[]; // 标签
  is_default: number; // 是否为默认流程
}

// 删除工单流程请求
export interface DeleteWorkorderProcessReq {
  id: number; // 流程ID
}

// 获取工单流程详情请求
export interface DetailWorkorderProcessReq {
  id: number; // 流程ID
}

// 工单流程列表请求
export interface ListWorkorderProcessReq {
  page: number; // 页码
  size: number; // 每页大小
  search?: string; // 搜索关键词
  category_id?: number; // 分类ID
  form_design_id?: number; // 关联表单设计ID
  status?: number; // 状态
  is_default?: number; // 是否为默认流程
}

export async function createWorkorderProcess(
  data: CreateWorkorderProcessReq,
) {
  return requestClient.post('/workorder/process/create', data);
}

export async function updateWorkorderProcess(
  data: UpdateWorkorderProcessReq,
) {
  return requestClient.put(`/workorder/process/update/${data.id}`, data);
}

export async function deleteWorkorderProcess(
  data: DeleteWorkorderProcessReq,
) {
  return requestClient.delete(`/workorder/process/delete/${data.id}`);
}

export async function listWorkorderProcess(
  params: ListWorkorderProcessReq,
) {
  return requestClient.get('/workorder/process/list', { params });
}

export async function detailWorkorderProcess(
  data: DetailWorkorderProcessReq,
) {
  return requestClient.get(`/workorder/process/detail/${data.id}`);
}
