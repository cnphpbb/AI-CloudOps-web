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

// 新增未来排班计划数据结构
export interface UserInfo {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: number;
  username: string;
  real_name: string;
  domain: string;
  desc: string;
  avatar: string;
  mobile: string;
  email: string;
  fei_shu_user_id: string;
  account_type: number;
  home_path: string;
  enable: number;
  apis: any;
}

export interface FuturePlanDetail {
  date: string;
  user: UserInfo;
  origin_user: string;
}

export interface FuturePlanResponse {
  details: FuturePlanDetail[];
  map: Record<string, string>; // 日期到用户名的映射
  user_name_map: Record<string, string>; // 日期到用户账号的映射
  origin_user_map: Record<string, string>; // 日期到原始用户的映射
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

export const createMonitorOnDutyGroupChangeApi = (
  data: createOnDutychangeReq,
) => {
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

export const getMonitorOnDutyGroupFuturePlanApi = (
  id: number,
  params?: { start_time: string; end_time: string },
) => {
  return requestClient.get<FuturePlanResponse>(
    `/monitor/onduty_groups/future_plan/${id}`,
    {
      params,
    },
  );
};
