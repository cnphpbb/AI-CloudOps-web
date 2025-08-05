import { requestClient } from '#/api/request';

export const CommentType = {
  NORMAL: 'normal', // 普通评论
  SYSTEM: 'system', // 系统评论
} as const;

export const CommentStatus = {
  NORMAL: 1, // 正常
  DELETED: 2, // 已删除
  HIDDEN: 3, // 已隐藏
} as const;

export interface WorkorderInstanceCommentItem {
  id: number; // 评论ID
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  instance_id: number; // 工单实例ID
  operator_id: number; // 操作人ID
  operator_name: string; // 操作人名称
  content: string; // 评论内容
  parent_id?: number; // 父评论ID, 如果没有父评论，则不传
  type: string; // 评论类型
  status: number; // 状态：1-正常，2-已删除，3-已隐藏
  is_system: number; // 是否系统评论：1-是，2-否
  children?: WorkorderInstanceCommentItem[]; // 子评论
}

export interface CreateWorkorderInstanceCommentReq {
  instance_id: number; // 工单实例ID
  content: string; // 评论内容
  parent_id?: number; // 父评论ID
  type?: string; // 评论类型
  status?: number; // 状态
  is_system?: number; // 是否系统评论
}

export interface UpdateWorkorderInstanceCommentReq {
  id: number; // 评论ID
  content: string; // 评论内容
  status?: number; // 状态
  is_system?: number; // 是否系统评论
}

export interface DeleteWorkorderInstanceCommentReq {
  id: number; // 评论ID
}

export interface DetailWorkorderInstanceCommentReq {
  id: number; // 评论ID
}

export interface ListWorkorderInstanceCommentReq {
  page: number; // 页码
  size: number; // 每页大小
  search?: string; // 搜索关键词
  instance_id?: number; // 工单实例ID
  type?: string; // 评论类型
  status?: number; // 状态
}
