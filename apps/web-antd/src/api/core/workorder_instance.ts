import { requestClient } from '#/api/request';

// 工单状态常量
export const InstanceStatus = {
  Draft: 0, // 草稿
  Processing: 1, // 处理中
  Completed: 2, // 已完成
  Cancelled: 3, // 已取消
  Rejected: 4, // 已拒绝
  Pending: 5, // 待处理
  Overdue: 6, // 已超时
};

// 优先级常量
export const Priority = {
  Low: 0, // 低
  Normal: 1, // 普通
  High: 2, // 高
  Urgent: 3, // 紧急
  Critical: 4, // 严重
};

// 工单实例请求结构
export interface CreateInstanceReq {
  title: string; // 工单标题
  template_id?: number; // 模板ID
  process_id: number; // 流程ID
  description?: string; // 描述
  priority?: number; // 优先级
  category_id?: number; // 分类ID
  due_date?: string; // 截止时间
  tags?: string[]; // 标签
  assignee_id?: number; // 处理人ID
}

export interface UpdateInstanceReq {
  id: number;
  title: string;
  description?: string;
  priority?: number;
  category_id?: number;
  due_date?: string;
  tags?: string[];
}

export interface ListInstanceReq {
  page?: number;
  size?: number;
  status?: number;
  search?: string;
  priority?: number;
  category_id?: number;
  creator_id?: number;
  assignee_id?: number;
  process_id?: number;
  template_id?: number;
  start_date?: string;
  end_date?: string;
  tags?: string[];
  overdue?: boolean;
}

export interface MyInstanceReq {
  page?: number;
  size?: number;
  search?: string;  
  type?: 'created' | 'assigned' | 'all';
  status?: number;
  priority?: number;
  category_id?: number;
  process_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface TransferInstanceReq {
  instance_id: number;
  assignee_id: number;
  comment?: string;
}

// 工单实例基础接口
export interface Instance {
  id: number;
  title: string;
  template_id?: number;
  process_id: number;
  form_data?: Record<string, any>;
  current_step: string;
  status: number;
  priority: number;
  category_id?: number;
  creator_id: number;
  description?: string;
  creator_name?: string;
  assignee_id?: number;
  assignee_name?: string;
  completed_at?: string;
  due_date?: string;
  tags?: string[];
  process_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  template?: any;
  process?: any;
  category?: any;
}

// 工单评论接口
export interface InstanceComment {
  id: number;
  instance_id: number;
  user_id: number;
  content: string;
  creator_id: number;
  creator_name?: string;
  parent_id?: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  children?: InstanceComment[];
}

// 工单流转记录接口
export interface InstanceFlow {
  id: number;
  instance_id: number;
  step_id: string;
  step_name: string;
  action: string;
  operator_id: number;
  operator_name?: string;
  comment?: string;
  form_data?: Record<string, any>;
  duration?: number;
  from_step_id?: string;
  to_step_id?: string;
  from_user_id?: number;
  to_user_id?: number;
  to_user_name?: string;
  created_at: string;
  updated_at: string;
}

// 删除工单实例请求
export interface DeleteInstanceReq {
  id: number;
}

// 获取工单详情请求
export interface DetailInstanceReq {
  id: number;
}

// 工单评论请求
export interface InstanceCommentReq {
  instance_id: number;
  content: string;
  parent_id?: number;
}

// 获取工单评论请求
export interface GetInstanceCommentsReq {
  id: number;
}

// 获取工单流转记录请求
export interface GetInstanceFlowsReq {
  id: number;
}

// 获取流程定义请求
export interface GetProcessDefinitionReq {
  id: number;
}

// 工单操作请求
export interface InstanceActionReq {
  instance_id: number;
  action: 'approve' | 'reject' | 'transfer' | 'revoke' | 'cancel';
  comment?: string;
  form_data?: Record<string, any>;
  assignee_id?: number;
  step_id: string;
}

// 创建工单实例
export const createInstance = (data: CreateInstanceReq) => {
  return requestClient.post('/workorder/instance/create', data);
};

// 更新工单实例
export const updateInstance = (id: number, data: UpdateInstanceReq) => {
  return requestClient.put(`/workorder/instance/update/${id}`, data);
};

// 删除工单实例
export const deleteInstance = (id: number) => {
  return requestClient.delete(`/workorder/instance/delete/${id}`);
};

// 获取工单实例列表
export const listInstance = (params: ListInstanceReq) => {
  return requestClient.get('/workorder/instance/list', { params });
};

// 获取工单实例详情
export const detailInstance = (id: number) => {
  return requestClient.get(`/workorder/instance/detail/${id}`);
};

// 转交工单实例
export const transferInstance = (id: number, data: TransferInstanceReq) => {
  return requestClient.post(`/workorder/instance/transfer/${id}`, data);
};

// 获取我的工单实例
export const getMyInstances = (params: MyInstanceReq) => {
  return requestClient.get('/workorder/instance/my', { params });
};

// 添加工单评论
export const commentInstance = (id: number, data: InstanceCommentReq) => {
  return requestClient.post(`/workorder/comment/${id}`, data);
};

// 获取工单评论
export const getInstanceComments = (id: number) => {
  return requestClient.get(`/workorder/comment/${id}`);
};

// 工单流程操作
export const processInstanceFlow = (id: number, data: InstanceActionReq) => {
  return requestClient.post(`/workorder/flow/action/${id}`, data);
};

// 获取工单流转记录
export const getInstanceFlows = (id: number) => {
  return requestClient.get(`/workorder/flow/${id}`);
};

// 获取流程定义
export const getProcessDefinition = (pid: number) => {
  return requestClient.get(`/workorder/flow/process/${pid}/definition`);
};
