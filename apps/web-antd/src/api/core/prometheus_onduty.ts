import { requestClient } from '#/api/request';

export interface MonitorOnDutyUser {
  id: number;
  real_name: string;
  username: string;
  fei_shu_user_id: string;
}

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
  today_duty_user: MonitorOnDutyUser;
  duty_plans: MonitorOnDutyPlan[];
  enable: 1 | 2;
  description: string;
}

export interface MonitorOnDutyPlan {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: number;
  on_duty_group_id: number;
  date: string;
  on_duty_user_id: number;
  is_adjusted: boolean;
  original_user_id: number;
  status: number;
  create_user_id: number;
  create_user_name: string;
  update_user_id: number;
  update_user_name: string;
  remark: string;
}

export interface MonitorOnDutyHistory {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: number;
  on_duty_group_id: number;
  date_string: string;
  on_duty_user_id: number;
  origin_user_id: number;
  create_user_name: string;
}

export interface OnDutyOne {
  date: string;
  user: MonitorOnDutyUser;
  origin_user: string;
}

export interface OnDutyPlanResp {
  details: OnDutyOne[];
  map: Record<string, string>;
  user_name_map: Record<string, string>;
  origin_user_map: Record<string, string>;
}

export interface GetOnDutyListParams {
  page: number;
  size: number;
  search?: string;
  pool_id?: number;
  enable?: 1 | 2;
}

export interface CreateMonitorOnDutyGroupReq {
  name: string;
  user_id: number;
  user_ids: number[];
  shift_days: number;
  description?: string;
}

export interface CreateMonitorOnDutyGroupChangeReq {
  on_duty_group_id: number;
  date: string;
  origin_user_id: number;
  on_duty_user_id: number;
  user_id: number;
  reason?: string;
}

export interface CreateMonitorOnDutyPlanReq {
  on_duty_group_id: number;
  date: string;
  on_duty_user_id: number;
  is_adjusted?: boolean;
  original_user_id?: number;
  create_user_id: number;
  remark?: string;
}

export interface UpdateMonitorOnDutyGroupReq {
  id: number;
  name: string;
  shift_days: number;
  user_ids: number[];
  description?: string;
  enable?: 1 | 2;
}

export interface GetMonitorOnDutyGroupFuturePlanReq {
  id: number;
  start_time: string;
  end_time: string;
}

export interface GetMonitorOnDutyHistoryReq {
  on_duty_group_id: number;
  start_date: string;
  end_date: string;
}

export async function getMonitorOnDutyGroupListApi(data: GetOnDutyListParams) {
  return requestClient.get('/monitor/onduty_groups/list', { params: data });
}

export async function createMonitorOnDutyGroupApi(
  data: CreateMonitorOnDutyGroupReq,
) {
  return requestClient.post('/monitor/onduty_groups/create', data);
}

export async function createMonitorOnDutyGroupChangeApi(
  data: CreateMonitorOnDutyGroupChangeReq,
) {
  return requestClient.post('/monitor/onduty_groups/changes', data);
}

export async function updateMonitorOnDutyGroupApi(
  data: UpdateMonitorOnDutyGroupReq,
) {
  return requestClient.put(`/monitor/onduty_groups/update/${data.id}`, data);
}

export async function deleteMonitorOnDutyGroupApi(id: number) {
  return requestClient.delete(`/monitor/onduty_groups/delete/${id}`);
}

export async function getMonitorOnDutyGroupDetailApi(id: number) {
  return requestClient.get(`/monitor/onduty_groups/detail/${id}`);
}

export async function getMonitorOnDutyGroupFuturePlanApi(
  id: number,
  params?: { start_time: string; end_time: string },
) {
  return requestClient.get(`/monitor/onduty_groups/future_plan/${id}`, {
    params,
  });
}

export async function getMonitorOnDutyHistoryApi(
  id: number,
  params: { start_date: string; end_date: string },
) {
  return requestClient.get(`/monitor/onduty_groups/history/${id}`, { params });
}
