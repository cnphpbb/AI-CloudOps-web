import { requestClient } from '#/api/request';

export interface MonitorAlertManagerPool {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  name: string;
  alert_manager_instances: string[];
  user_id: number;
  resolve_timeout: string;
  group_wait: string;
  group_interval: string;
  repeat_interval: string;
  group_by: string[];
  receiver: string;
  creator_name: string;
}

export interface GetAlertManagerPoolListParams {
  page: number;
  size: number;
  search?: string;
  pool_id?: number;
}

export interface createAlertManagerPoolReq {
  name: string;
  alert_manager_instances: string[];
  resolve_timeout?: string;
  group_wait?: string;
  group_interval?: string;
  repeat_interval?: string;
  group_by?: string[];
  receiver: string;
}

export interface updateAlertManagerPoolReq {
  id: number;
  name: string;
  alert_manager_instances: string[];
  resolve_timeout?: string;
  group_wait?: string;
  group_interval?: string;
  repeat_interval?: string;
  group_by?: string[];
  receiver: string;
}

export const getAlertManagerPoolListApi = (data: GetAlertManagerPoolListParams) => {
  return requestClient.get('/monitor/alert_manager_pools/list', { params: data });
};

export const createAlertManagerPoolApi = (data: createAlertManagerPoolReq) => {
  return requestClient.post('/monitor/alert_manager_pools/create', data);
};

export const updateAlertManagerPoolApi = (data: updateAlertManagerPoolReq) => {
  return requestClient.put(`/monitor/alert_manager_pools/update/${data.id}`, data);
};

export const deleteAlertManagerPoolApi = (id: number) => {
  return requestClient.delete(`/monitor/alert_manager_pools/delete/${id}`);
};

export const getAlertManagerPoolDetailApi = (id: number) => {
  return requestClient.get(`/monitor/alert_manager_pools/detail/${id}`);
};
