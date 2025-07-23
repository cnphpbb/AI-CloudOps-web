import { requestClient } from '#/api/request';

export interface MonitorSendGroup {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  name: string;
  name_zh: string;
  enable: number;
  user_id: number;
  pool_id: number;
  on_duty_group_id: number;
  static_receive_users: {
    id: number;
    username: string;
  }[];
  fei_shu_qun_robot_token: string;
  repeat_interval: string;
  send_resolved: number;
  notify_methods: string[];
  need_upgrade: number;
  monitor_send_group_first_upgrade_users: {
    id: number;
    username: string;
  }[];
  upgrade_minutes: number;
  second_upgrade_users: {
    id: number;
    username: string;
  }[];
  static_receive_user_names: string[];
  first_user_names: string[];
  second_user_names: string[];
  pool_name: string;
  on_duty_group_name: string;
  create_user_name: string;
}

export interface GetSendGroupListParams {
  page: number;
  size: number;
  search?: string;
  pool_id?: number;
  enable?: number;
  on_duty_group_id?: number;
}

export interface createSendGroupReq {
  name: string;
  name_zh: string;
  enable: number;
  user_id?: number;
  pool_id: number;
  on_duty_group_id: number;
  static_receive_users: {
    id: number;
    username: string;
  }[];
  fei_shu_qun_robot_token?: string;
  repeat_interval?: string;
  send_resolved: number;
  notify_methods: string[];
  need_upgrade: number;
  monitor_send_group_first_upgrade_users: {
    id: number;
    username: string;
  }[];
  upgrade_minutes?: number;
  second_upgrade_users: {
    id: number;
    username: string;
  }[];
}

export interface updateSendGroupReq {
  id: number;
  name: string;
  name_zh: string;
  enable: number;
  user_id?: number;
  pool_id: number;
  on_duty_group_id: number;
  static_receive_users: {
    id: number;
    username: string;
  }[];
  fei_shu_qun_robot_token?: string;
  repeat_interval?: string;
  send_resolved: number;
  notify_methods: string[];
  need_upgrade: number;
  monitor_send_group_first_upgrade_users: {
    id: number;
    username: string;
  }[];
  upgrade_minutes?: number;
  second_upgrade_users: {
    id: number;
    username: string;
  }[];
}

export async function getMonitorSendGroupListApi(data: GetSendGroupListParams) {
  return requestClient.get('/monitor/send_groups/list', { params: data });
}

export async function getMonitorSendGroupDetailApi(id: number) {
  return requestClient.get(`/monitor/send_groups/detail/${id}`);
}

export async function createMonitorSendGroupApi(data: createSendGroupReq) {
  return requestClient.post('/monitor/send_groups/create', data);
}

export async function updateMonitorSendGroupApi(data: updateSendGroupReq) {
  return requestClient.put(`/monitor/send_groups/update/${data.id}`, data);
}

export async function deleteMonitorSendGroupApi(id: number) {
  return requestClient.delete(`/monitor/send_groups/delete/${id}`);
}
