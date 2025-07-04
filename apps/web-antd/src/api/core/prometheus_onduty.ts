import { requestClient } from '#/api/request';

export interface MonitorOnDutyChange {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  on_duty_group_id: number;
  user_id: number;
  date: string;
  origin_user_id: number;
  on_duty_user_id: number;
  creator_name: string;
  target_user_name: string;
  origin_user_name: string;
  pool_name: string;
}

export interface MonitorOnDutyGroup {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  name: string;
  user_id: number;
  members: {
    id: number;
    username: string;
  }[];
  shift_days: number;
  yesterday_normal_duty_user_id: number;
  creator_name: string;
  today_duty_user: {
    id: number;
    username: string;
  };
  user_names: string[];
}

export interface MonitorOnDutyHistory {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  on_duty_group_id: number;
  date_string: string;
  on_duty_user_id: number;
  origin_user_id: number;
  creator_name: string;
  on_duty_user_name: string;
  origin_user_name: string;
  pool_name: string;
}

export interface GetOnDutyListParams {
  page: number;
  size: number;
  search?: string;
  pool_id?: number;
  enable?: number;
}

export interface createOnDutyReq {
  name: string;
  member_ids: number[];
  shift_days: number;
}

export interface createOnDutychangeReq {
  on_duty_group_id: number;
  date: string;
  origin_user_id: number;
  on_duty_user_id: number;
}

export interface updateOnDutyReq {
  id: number;
  name: string;
  shift_days: number;
  member_ids: number[];
}

export interface getOnDutyFuturePlan {
  id: number;
  start_time: string;
  end_time: string;
}

export const getMonitorOnDutyGroupListApi = (data: GetOnDutyListParams) => {
  return requestClient.get('/monitor/onduty_groups/list', { params: data });
};

export const createMonitorOnDutyGroupApi = (data: createOnDutyReq) => {
  return requestClient.post('/monitor/onduty_groups/create', data);
};

export const createMonitorOnDutyGroupChangeApi = (data: createOnDutychangeReq) => {
  return requestClient.post('/monitor/onduty_groups/changes', data);
};

export const updateMonitorOnDutyGroupApi = (data: updateOnDutyReq) => {
  return requestClient.put(`/monitor/onduty_groups/update/${data.id}`, data);
};

export const deleteMonitorOnDutyGroupApi = (id: number) => {
  return requestClient.delete(`/monitor/onduty_groups/delete/${id}`);
};

export const getMonitorOnDutyGroupDetailApi = (id: number) => {
  return requestClient.get(`/monitor/onduty_groups/detail/${id}`);
};

export const getMonitorOnDutyGroupFuturePlanApi = (id: number) => {
  return requestClient.get(`/monitor/onduty_groups/future_plan/${id}`);
};
