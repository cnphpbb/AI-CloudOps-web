import { requestClient } from '#/api/request';

// 监控采集任务相关接口类型定义

// 采集任务项
export interface MonitorScrapeJobItem {
  id: number;
  name: string;
  user_id: number;
  enable: 1 | 2;
  service_discovery_type: string;
  metrics_path: string;
  scheme: string;
  scrape_interval: number;
  scrape_timeout: number;
  pool_id: number;
  relabel_configs_yaml_string: string;
  refresh_interval: number;
  port: number;
  ip_address: string;
  kube_config_file_path: string;
  tls_ca_file_path: string;
  tls_ca_content: string;
  bearer_token: string;
  bearer_token_file: string;
  kubernetes_sd_role: string;
  create_user_name?: string;
  created_at?: string;
  updated_at?: string;
}

// 获取采集任务列表参数
export interface GetScrapeJobListParams {
  page?: number;
  page_size?: number;
  pool_id?: number;
  enable?: 1 | 2;
  search?: string;
}

// 创建采集任务请求参数
export interface createScrapeJobReq {
  name: string;
  user_id?: number;
  enable: 1 | 2;
  service_discovery_type: string;
  metrics_path: string;
  scheme: string;
  scrape_interval: number;
  scrape_timeout: number;
  pool_id: number;
  relabel_configs_yaml_string?: string;
  refresh_interval: number;
  port: number;
  ip_address?: string;
  kube_config_file_path?: string;
  tls_ca_file_path?: string;
  tls_ca_content?: string;
  bearer_token?: string;
  bearer_token_file?: string;
  kubernetes_sd_role?: string;
}

// 更新采集任务请求参数
export interface updateScrapeJobReq {
  id: number;
  name: string;
  enable: 1 | 2;
  service_discovery_type: string;
  metrics_path: string;
  scheme: string;
  scrape_interval: number;
  scrape_timeout: number;
  pool_id: number;
  relabel_configs_yaml_string?: string;
  refresh_interval: number;
  port: number;
  ip_address?: string;
  kube_config_file_path?: string;
  tls_ca_file_path?: string;
  tls_ca_content?: string;
  bearer_token?: string;
  bearer_token_file?: string;
  kubernetes_sd_role?: string;
}


export const getMonitorScrapeJobListApi = (data: GetScrapeJobListParams) => {
  return requestClient.get(`/monitor/scrape_jobs/list`, { params: data });
};

export const createScrapeJobApi = (data: createScrapeJobReq) => {
  return requestClient.post(`/monitor/scrape_jobs/create`, data);
};

export const updateScrapeJobApi = (data: updateScrapeJobReq) => {
  return requestClient.put(`/monitor/scrape_jobs/update/${data.id}`, data);
};

export const deleteScrapeJobApi = (id: number) => {
  return requestClient.delete(`/monitor/scrape_jobs/delete/${id}`);
};
