import { requestClient } from '#/api/request';

export interface MonitorScrapePoolItem {
  id: number;
  CreatedAt: string;
  UpdatedAt: string;
  name: string;
  prometheusInstances: string[];
  alertManagerInstances: string[];
  userId: number;
  scrapeInterval: number;
  scrapeTimeout: number;
  externalLabels: string[];
  supportAlert: number;
  supportRecord: number;
  remoteReadUrl: string;
  alertManagerUrl: string;
  ruleFilePath: string;
  recordFilePath: string;
  remoteWriteUrl: string;
  remoteTimeoutSeconds: number;
}

export interface GeneralRes {
  code: number;
  data: any;
  message: string;
  type: string;
}

export interface createMonitorScrapePoolReq {
  name: string;
  prometheusInstances: string[];
  alertManagerInstances: string[];
  scrapeInterval: number;
  scrapeTimeout: number;
  externalLabels: string[];
  supportAlert: number;
  supportRecord: number;
  remoteReadUrl: string;
  alertManagerUrl: string;
  ruleFilePath: string;
  recordFilePath: string;
  remoteWriteUrl: string;
  remoteTimeoutSeconds: number;
}

export interface updateMonitorScrapePoolReq {
  id: number;
  name: string;
  prometheusInstances: string[];
  alertManagerInstances: string[];
  scrapeInterval: number;
  scrapeTimeout: number;
  externalLabels: string[];
  supportAlert: number;
  supportRecord: number;
  remoteReadUrl: string;
  alertManagerUrl: string;
  ruleFilePath: string;
  recordFilePath: string;
  remoteWriteUrl: string;
  remoteTimeoutSeconds: number;
}

export interface MonitorScrapeJobItem {
  id: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  userId: number;
  enable: number;
  serviceDiscoveryType: string;
  metricsPath: string;
  scheme: string;
  scrapeInterval: number;
  scrapeTimeout: number;
  poolId: number;
  refreshInterval: number;
  port: number;
  treeNodeIds: string[];
  key: string;
}

export interface createScrapeJobReq {
  name: string;
  enable: number;
  serviceDiscoveryType: string;
  metricsPath: string;
  scheme: string;
  scrapeInterval: number;
  scrapeTimeout: number;
  poolId: number | null;
  refreshInterval: number;
  port: number;
  treeNodeIds: string[];
}

export interface editScrapeJobReq {
  id: number;
  name: string;
  enable: number;
  serviceDiscoveryType: string;
  metricsPath: string;
  scheme: string;
  scrapeInterval: number;
  scrapeTimeout: number;
  poolId: number | null;
  refreshInterval: number;
  port: number;
  treeNodeIds: string[];
}

export interface MonitorAlertPoolItem {
  name: string;
  userId: number;
  alertManagerInstances: string[];
  resolveTimeout: string;
  groupWait: string;
  groupInterval: string;
  repeatInterval: string;
  groupBy: string[];
  receiver: string;
  CreatedAt: string;
}

export interface createAlertManagerPoolReq {
  name: string;
  alertManagerInstances: string[];
  resolveTimeout: string;
  groupWait: string;
  groupInterval: string;
  repeatInterval: string;
  groupBy: string[];
  receiver: string;
}

export interface editAlertManagerPoolReq {
  id: number;
  name: string;
  alertManagerInstances: string[];
  resolveTimeout: string;
  groupWait: string;
  groupInterval: string;
  repeatInterval: string;
  groupBy: string[];
  receiver: string;
}

export interface createAlertRuleReq {
  name: string;
  poolId: number;
  sendGroupId: number;
  treeNodeId: number;
  expr: string;
  severity: string;
  forTime: string;
  enable: number;
  labels: string[];
  annotations: string[];
}

export interface updateAlertRuleReq {
  id: number;
  name: string;
  poolId: number;
  sendGroupId: number;
  treeNodeId: number;
  expr: string;
  severity: string;
  forTime: string;
  enable: number;
  labels: string[];
  annotations: string[];
}

export interface validateExprApiReq {
  promqlExpr: string;
}

export interface MonitorAlertEventItem {
  id: number;
  alertName: string;
  fingerprint: string;
  status: string;
  sendGroupId: string;
  eventTimes: number;
  renLingUserId: string;
  labels: string[];
  createTime: string;
  silenceId: string;
}

export interface createAlertManagerRecordReq {
  name: string;
  recordName: string;
  poolId: number;
  treeNodeId: number;
  enable: number;
  forTime: string;
  expr: string;
}

export interface updateAlertManagerRecordReq {
  id: number;
  name: string;
  recordName: string;
  poolId: number;
  treeNodeId: number;
  enable: number;
  forTime: string;
  expr: string;
}

export interface getOnDutyFuturePlan {
  id: number;
  startTime: string;
  endTime: string;
}

export interface createOnDutychangeItem {
  onDutyGroupId: number;
  date: string;
  originUserId: number;
  onDutyUserId: number;
}

export interface createSendGroupReq {
  name: string;
  nameZh: string;
  enable: number;
  poolId: number;
  onDutyGroupId: number;
  staticReceiveUsers: string[];
  feiShuQunRobotToken: string; 
  repeatInterval: string; 
  sendResolved: number;
  notifyMethods: string[];
  needUpgrade: number;
  firstUpgradeUsers: string[];
  upgradeMinutes: number;
  secondUpgradeUsers: string[];
}

export interface updateSendGroupReq {
  id: number;
  name: string;
  nameZh: string;
  enable: number;
  poolId: number;
  onDutyGroupId: number;
  staticReceiveUsers: string[];
  feiShuQunRobotToken: string; 
  repeatInterval: string; 
  sendResolved: number;
  notifyMethods: string[];
  needUpgrade: number;
  firstUpgradeUsers: string[];
  upgradeMinutes: number;
  secondUpgradeUsers: string[];
}

export const getMonitorScrapePoolApi = () => {
  return requestClient.get<MonitorScrapePoolItem[]>('/monitor/scrape_pools');
};

export const createMonitorScrapePoolApi = (
  data: createMonitorScrapePoolReq,
) => {
  return requestClient.post('/monitor/scrape_pools/create', data);
};

export const deleteMonitorScrapePoolApi = (id: number) => {
  return requestClient.delete(`/monitor/scrape_pools/${id}`);
};

export const updateMonitorScrapePoolApi = (
  data: updateMonitorScrapePoolReq,
) => {
  return requestClient.post('/monitor/scrape_pools/update', data);
};

export const getMonitorScrapeJobApi = () => {
  return requestClient.get<MonitorScrapeJobItem[]>('/monitor/scrape_jobs');
};

export const createScrapeJobApi = (data: createScrapeJobReq) => {
  return requestClient.post('/monitor/scrape_jobs/create', data);
};

export const deleteScrapeJobApi = (id: number) => {
  return requestClient.delete(`/monitor/scrape_jobs/${id}`);
};

export const updateScrapeJobApi = (data: editScrapeJobReq) => {
  return requestClient.post('/monitor/scrape_jobs/update', data);
};

export const getAlertManagerPoolsApi = () => {
  return requestClient.get('/monitor/alertManager_pools/');
};

export const createAlertManagerPoolApi = (data: createAlertManagerPoolReq) => {
  return requestClient.post('/monitor/alertManager_pools/create', data);
};

export const updateAlertManagerPoolApi = (data: editAlertManagerPoolReq) => {
  return requestClient.post('/monitor/alertManager_pools/update', data);
};

export const deleteAlertManagerPoolApi = (id: number) => {
  return requestClient.delete(`/monitor/alertManager_pools/${id}`);
};

export const getAlertRulesApi = () => {
  return requestClient.get('/monitor/alert_rules');
};

export const createAlertRuleApi = (data: createAlertRuleReq) => {
  return requestClient.post('/monitor/alert_rules/create', data);
};

export const updateAlertRuleApi = (data: updateAlertRuleReq) => {
  return requestClient.post('/monitor/alert_rules/update', data);
};

export const deleteAlertRuleApi = (id: number) => {
  return requestClient.delete(`/monitor/alert_rules/${id}`);
};

export const validateExprApi = (data: validateExprApiReq) => {
  return requestClient.post('/monitor/alert_rules/promql_check', data);
};

export const getAlertEventsApi = () => {
  return requestClient.get('/monitor/alert_events');
};

export const silenceAlertApi = () => {
  return requestClient.get('/monitor/alert_events');
};

export const claimAlertApi = () => {
  return requestClient.get('/monitor/alert_events');
};

export const cancelSilenceAlertApi = () => {
  return requestClient.get('/monitor/alert_events');
};

export const silenceBatchApi = () => {
  return requestClient.get('/monitor/alert_events');
};

export const getRecordRulesApi = () => {
  return requestClient.get('/monitor/record_rules');
};

export const createRecordRuleApi = (data: createAlertManagerRecordReq) => {
  return requestClient.post('/monitor/record_rules/create', data);
};

export const updateRecordRuleApi = (data: updateAlertManagerRecordReq) => {
  return requestClient.post('/monitor/record_rules/update', data);
};

export const deleteRecordRuleApi = (id: number) => {
  return requestClient.delete(`/monitor/record_rules/${id}`);
};

export const getAllOnDutyApi = () => {
  return requestClient.get('/monitor/onDuty_groups/list');
};

export const getOnDutyApi = (id: number) => {
  return requestClient.get(`/monitor/onDuty_groups/${id}`);
};

export const createOnDutyApi = (data: any) => {
  return requestClient.post('/monitor/onDuty_groups/create', data);
};

export const updateOnDutyApi = (data: any) => {
  return requestClient.post('/monitor/onDuty_groups/update', data);
};

export const deleteOnDutyApi = (id: number) => {
  return requestClient.delete(`/monitor/onDuty_groups/${id}`);
};

export const getOnDutyFuturePlanApi = (data: getOnDutyFuturePlan) => {
  return requestClient.post('/monitor/onDuty_groups/future_plan', data);
};

export const createOnDutyChangeApi = (data: createOnDutychangeItem) => {
  return requestClient.post('/monitor/onDuty_groups/changes', data);
};

export const getMonitorSendGroupApi = () => {
  return requestClient.get('/monitor/send_groups/list');
};

export const createMonitorSendGroupApi = (data: createSendGroupReq) => {
  return requestClient.post('/monitor/send_groups/create', data);
};

export const updateMonitorSendGroupApi = (data: updateSendGroupReq) => {
  return requestClient.post('/monitor/send_groups/update', data);
};

export const deleteMonitorSendGroupApi = (id: number) => {
  return requestClient.delete(`/monitor/send_groups/${id}`);
};


