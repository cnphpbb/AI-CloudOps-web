import { requestClient } from '#/api/request';

export interface ResourceEcs {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  instance_name: string;
  instance_id: string;
  cloud_provider: string;
  region_id: string;
  zone_id: string;
  vpc_id: string;
  status: string;
  creation_time: string;
  environment: string;
  instance_charge_type: string;
  description: string;
  tags: string[];
  security_group_ids: string[];
  private_ip_address: string[];
  public_ip_address: string[];

  // 资源创建和管理标志
  create_by_order: boolean;
  last_sync_time: string;
  tree_node_id: number;
  cpu: number;
  memory: number;
  instanceType: string;
  imageId: string;
  ipAddr: string;
  port: number;
  hostname: string;
  password: string;
  key: string;
  authMode: string; // password或key
  osType: string;
  vmType: number;
  osName: string;
  disk: number;
  networkInterfaces: string[];
  diskIds: string[];
  startTime: string;
  autoReleaseTime: string;
  ecsTreeNodes: any[];
}

export interface CreateEcsResourceReq {
  periodUnit: string; // Month 月 Year 年
  period: number;
  autoRenew: boolean; // 是否自动续费
  instanceChargeType: string; // 付费类型
  spotStrategy: string; // NoSpot 默认值 表示正常按量付费 SpotAsPriceGo 表示自动竞价
  spotDuration: number; // 竞价时长
  systemDiskSize: number; // 系统盘大小
  dataDiskSize: number; // 数据盘大小
  dataDiskCategory: string; // 数据盘类型
  dryRun: boolean; // 是否仅预览而不创建
  tags: Record<string, string>;
}

export interface ListEcsResourceReq {
  pageNumber: number;
  pageSize: number;
  provider: string;
  region: string;
}

// ResourceECSListResp ECS资源列表响应
export interface ResourceECSListResp {
  total: number;
  data: ResourceEcs[];
}

// ResourceECSDetailResp ECS资源详情响应
export interface ResourceECSDetailResp {
  data: ResourceEcs;
}

// StartEcsReq ECS启动请求
export interface StartEcsReq {
  provider: string;
  region: string;
  instanceId: string;
}

// StopEcsReq ECS停止请求
export interface StopEcsReq {
  provider: string;
  region: string;
  instanceId: string;
}

// RestartEcsReq ECS重启请求
export interface RestartEcsReq {
  provider: string;
  region: string;
  instanceId: string;
}

// DeleteEcsReq ECS删除请求
export interface DeleteEcsReq {
  provider: string;
  region: string;
  instanceId: string;
}

// GetEcsDetailReq 获取ECS详情请求
export interface GetEcsDetailReq {
  provider: string;
  region: string;
  instanceId: string;
}

// ListInstanceOptionsReq 实例选项列表请求
export interface ListInstanceOptionsReq {
  provider: string;
  payType?: string;
  region?: string;
  zone?: string;
  instanceType?: string;
  systemDiskCategory?: string;
  dataDiskCategory?: string;
}

export interface ListInstanceOptionsResp {
  dataDiskCategory: string;
  systemDiskCategory: string;
  instanceType: string;
  region: string;
  zone: string;
  payType: string;
  valid: boolean;
  cpu: number;
  memory: number;
}

export function getEcsResourceList(req: ListEcsResourceReq) {
  return requestClient.post('/resource/ecs/list', req);
}

export function getEcsResourceDetail(req: GetEcsDetailReq) {
  return requestClient.post('/resource/ecs/detail', req);
}

export function createEcsResource(req: CreateEcsResourceReq) {
  return requestClient.post('/resource/ecs/create', req);
}

export function startEcsResource(req: StartEcsReq) {
  return requestClient.post('/resource/ecs/start', req);
}

export function stopEcsResource(req: StopEcsReq) {
  return requestClient.post('/resource/ecs/stop', req);
}

export function restartEcsResource(req: RestartEcsReq) {
  return requestClient.post('/resource/ecs/restart', req);
}

export function deleteEcsResource(req: DeleteEcsReq) {
  return requestClient.delete('/resource/ecs/delete', { data: req });
}

export function getInstanceOptions(req: ListInstanceOptionsReq) {
  return requestClient.post('/resource/ecs/instance_options', req);
}
