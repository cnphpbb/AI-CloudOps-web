import { requestClient } from '#/api/request';

// 值班组用户
export interface MonitorOnDutyUser {
  id: number;
  real_name: string;
  username: string;
  fei_shu_user_id?: string;
}

// 值班组
export interface MonitorOnDutyGroup {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: number;
  name: string;
  user_id: number;
  shift_days: number;
  yesterday_normal_duty_user_id: number;
  create_user_name: string;
  users: MonitorOnDutyUser[];
  enable: 1 | 2;
  description: string;
  today_duty_user?: MonitorOnDutyUser;
}

// 换班记录
export interface MonitorOnDutyChange {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: number;
  on_duty_group_id: number;
  user_id: number;
  date: string;
  origin_user_id: number;
  on_duty_user_id: number;
  create_user_name: string;
  reason: string;
}

// 历史记录
export interface MonitorOnDutyHistory {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: number;
  on_duty_group_id: number;
  date_string: string;
  create_user_name: string;
  on_duty_user_id: number;
  origin_user_id: number;
}

// 单日值班信息
export interface MonitorOnDutyOne {
  date: string;
  user: MonitorOnDutyUser | null;
  origin_user: string;
}

// 获取值班组列表参数
export interface GetMonitorOnDutyGroupListReq {
  page: number;
  size: number;
  search?: string;
  enable?: 1 | 2;
}

// 创建值班组参数
export interface CreateMonitorOnDutyGroupReq {
  name: string;
  user_ids: number[];
  shift_days: number;
  description?: string;
}

// 创建换班记录参数
export interface CreateMonitorOnDutyGroupChangeReq {
  on_duty_group_id: number;
  date: string;
  origin_user_id: number;
  on_duty_user_id: number;
  reason?: string;
}

// 创建值班计划参数
export interface CreateMonitorOnDutyPlanReq {
  on_duty_group_id: number;
  date: string;
  on_duty_user_id: number;
  is_adjusted?: boolean;
  original_user_id?: number;
  create_user_id: number;
  remark?: string;
}

// 更新值班组参数
export interface UpdateMonitorOnDutyGroupReq {
  id: number;
  name: string;
  shift_days: number;
  user_ids: number[];
  description?: string;
  enable?: 1 | 2;
}

// 删除值班组参数
export interface DeleteMonitorOnDutyGroupReq {
  id: number;
}

// 获取值班组详情参数
export interface GetMonitorOnDutyGroupReq {
  id: number;
}

// 获取未来值班计划参数
export interface GetMonitorOnDutyGroupFuturePlanReq {
  id: number;
  start_time: string;
  end_time: string;
}

// 获取值班历史参数
export interface GetMonitorOnDutyHistoryReq {
  on_duty_group_id: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface GetMonitorOnDutyGroupChangeListReq {
  on_duty_group_id: number;
  page?: number;
  size?: number;
}

// 获取值班组列表
export async function getMonitorOnDutyGroupListApi(data: GetMonitorOnDutyGroupListReq) {
  return requestClient.get('/monitor/onduty_groups/list', { params: data });
}

// 创建值班组
export async function createMonitorOnDutyGroupApi(
  data: CreateMonitorOnDutyGroupReq,
) {
  return requestClient.post('/monitor/onduty_groups/create', data);
}

// 创建换班记录
export async function createMonitorOnDutyGroupChangeApi(
  data: CreateMonitorOnDutyGroupChangeReq,
) {
  return requestClient.post('/monitor/onduty_groups/changes', data);
}

// 更新值班组
export async function updateMonitorOnDutyGroupApi(
  data: UpdateMonitorOnDutyGroupReq,
) {
  return requestClient.put(`/monitor/onduty_groups/update/${data.id}`, data);
}

// 删除值班组
export async function deleteMonitorOnDutyGroupApi(id: number) {
  return requestClient.delete(`/monitor/onduty_groups/delete/${id}`);
}

// 获取值班组详情
export async function getMonitorOnDutyGroupDetailApi(id: number) {
  return requestClient.get(`/monitor/onduty_groups/detail/${id}`);
}

// 获取未来值班计划
export async function getMonitorOnDutyGroupFuturePlanApi(
  id: number,
  params?: { start_time: string; end_time: string },
) {
  return requestClient.get(`/monitor/onduty_groups/future_plan/${id}`, {
    params,
  });
}

// 获取值班历史
export async function getMonitorOnDutyHistoryApi(
  id: number,
  params?: { 
    start_date?: string; 
    end_date?: string;
    search?: string;
    page?: number;
    size?: number;
  }
) {
  return requestClient.get(`/monitor/onduty_groups/history/${id}`, { params });
}

export async function getMonitorOnDutyGroupChangeListApi(
  id: number,
  params?: { page?: number; size?: number },
) {
  return requestClient.get(`/monitor/onduty_groups/changes/${id}`, { params });
}
