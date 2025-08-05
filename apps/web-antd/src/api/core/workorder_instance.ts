import { requestClient } from '#/api/request';
import type { WorkorderInstanceCommentItem } from './workorder_instance_comment';
import type { WorkorderInstanceFlowItem } from './workorder_instance_flow';
import type { WorkorderInstanceTimelineItem } from './workorder_instance_time_line';

// 工单状态
export const InstanceStatus = {
  Draft: 1, // 草稿
  Pending: 2, // 待处理
  Processing: 3, // 处理中
  Completed: 4, // 已完成
  Rejected: 5, // 已拒绝
  Cancelled: 6, // 已取消
} as const;

// 工单优先级
export const Priority = {
  Low: 1, // 低
  Normal: 2, // 普通
  High: 3, // 高
} as const;

// WorkorderInstance 工单实例
export interface WorkorderInstanceItem {
  id: number; // 工单ID
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  title: string; // 工单标题
  serial_number: string; // 工单编号
  process_id: number; // 流程ID
  form_data: any; // 表单数据
  status: number; // 状态
  priority: number; // 优先级
  operator_id: number; // 操作人ID
  operator_name: string; // 操作人名称
  assignee_id?: number; // 当前处理人ID
  description?: string; // 详细描述
  tags?: string[]; // 标签
  due_date?: string; // 截止时间
  completed_at?: string; // 完成时间
  comments?: WorkorderInstanceCommentItem[]; // 评论
  flows?: WorkorderInstanceFlowItem[]; // 流转记录
  timelines?: WorkorderInstanceTimelineItem[]; // 时间线
}

// 创建工单实例请求
export interface CreateWorkorderInstanceReq {
  title: string; // 工单标题
  process_id: number; // 流程ID
  form_data: any; // 表单数据
  status: number; // 状态
  priority: number; // 优先级
  assignee_id?: number; // 当前处理人ID
  description?: string; // 详细描述
  tags?: string[]; // 标签
  due_date?: string; // 截止时间
}

// 更新工单实例请求
export interface UpdateWorkorderInstanceReq {
  id: number; // 工单ID
  title?: string; // 工单标题
  description?: string; // 详细描述
  priority?: number; // 优先级
  tags?: string[]; // 标签
  due_date?: string; // 截止时间
  status?: number; // 状态
  assignee_id?: number; // 当前处理人ID
  form_data?: any; // 表单数据
  completed_at?: string; // 完成时间
}

// 删除工单实例请求
export interface DeleteWorkorderInstanceReq {
  id: number; // 工单ID
}

// 工单实例详情请求
export interface DetailWorkorderInstanceReq {
  id: number; // 工单ID
}

// 工单实例列表请求
export interface ListWorkorderInstanceReq {
  page: number; // 页码
  size: number; // 每页大小
  search?: string; // 搜索关键词
  status?: number; // 状态
  priority?: number; // 优先级
  process_id?: number; // 流程ID
}

// 提交工单请求
export interface SubmitWorkorderInstanceReq {
  id: number; // 工单ID
}

// 指派工单请求
export interface AssignWorkorderInstanceReq {
  id: number; // 工单ID
  assignee_id: number; // 指派的处理人ID
}

// 审批通过工单请求
export interface ApproveWorkorderInstanceReq {
  id: number; // 工单ID
  comment?: string; // 审批意见
}

// 拒绝工单请求
export interface RejectWorkorderInstanceReq {
  id: number; // 工单ID
  comment: string; // 拒绝理由
}
