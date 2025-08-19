import { requestClientAIOps } from '#/api/request';

// 健康检查响应数据结构
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    prometheus: boolean;
    kubernetes: boolean;
    llm: boolean;
    notification: boolean;
    prediction: boolean;
    coordinator: boolean;
    coordinator_detector: boolean;
    coordinator_strategist: boolean;
    coordinator_executor: boolean;
  };
  system: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: {
      bytes_sent: number;
      bytes_recv: number;
      packets_sent: number;
      packets_recv: number;
    };
    load_average: number[];
  };
}

export async function healthApi() {
  return requestClientAIOps.get<{
    status: string;
    components?: Record<string, any>;
    system?: Record<string, any>;
    version?: string;
    uptime?: number;
  }>('/health');
}
