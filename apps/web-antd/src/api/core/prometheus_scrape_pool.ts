import { requestClient } from '#/api/request';

// 采集池列表请求参数
export interface GetScrapePoolListParams {
  page?: number;
  size?: number;
  search?: string;
  support_alert?: 1 | 2;
  support_record?: 1 | 2;
}

// 采集池详情
export interface ScrapePoolItem {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  name: string;
  prometheus_instances: string[];
  alert_manager_instances: string[];
  user_id: number;
  scrape_interval: number;
  scrape_timeout: number;
  remote_timeout_seconds: number;
  support_alert: boolean;
  support_record: boolean;
  external_labels: string[];
  remote_write_url: string;
  remote_read_url: string;
  alert_manager_url: string;
  rule_file_path: string;
  record_file_path: string;
  create_user_name: string;
}

// 创建采集池请求
export interface createMonitorScrapePoolReq {
  name: string;
  prometheus_instances: string[];
  alert_manager_instances: string[];
  user_id: number;
  scrape_interval: number;
  scrape_timeout: number;
  remote_timeout_seconds: number;
  support_alert: 1 | 2;
  support_record: 1 | 2;
  external_labels: string[];
  remote_write_url: string;
  remote_read_url: string;
  alert_manager_url: string;
  rule_file_path: string;
  record_file_path: string;
}

// 更新采集池请求
export interface updateMonitorScrapePoolReq {
  id: number;
  name: string;
  prometheus_instances: string[];
  alert_manager_instances: string[];
  user_id: number;
  scrape_interval: number;
  scrape_timeout: number;
  remote_timeout_seconds: number;
  support_alert: 1 | 2;
  support_record: 1 | 2;
  external_labels: string[];
  remote_write_url: string;
  remote_read_url: string;
  alert_manager_url: string;
  rule_file_path: string;
  record_file_path: string;
}

// 获取采集池列表
export const getMonitorScrapePoolListApi = (data: GetScrapePoolListParams) => {
  return requestClient.get(`/monitor/scrape_pools/list`, { params: data });
};

// 创建采集池
export const createMonitorScrapePoolApi = (
  data: createMonitorScrapePoolReq,
) => {
  return requestClient.post(`/monitor/scrape_pools/create`, data);
};

// 更新采集池
export const updateMonitorScrapePoolApi = (
  id: number,
  data: updateMonitorScrapePoolReq,
) => {
  return requestClient.put(`/monitor/scrape_pools/update/${id}`, data);
};

// 删除采集池
export const deleteMonitorScrapePoolApi = (id: number) => {
  return requestClient.delete(`/monitor/scrape_pools/${id}`);
};
