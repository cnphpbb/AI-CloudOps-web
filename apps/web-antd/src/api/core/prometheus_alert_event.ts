import { requestClient } from '#/api/request';

export interface MonitorAlertEventItem {
  id: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  alert_name: string;
  fingerprint: string;
  status: 'firing' | 'silenced' | 'claimed' | 'resolved';
  rule_id: number;
  send_group_id: number;
  event_times: number;
  silence_id: string;
  ren_ling_user_id: number;
  labels: string[];
  alert_rule_name: string;
  send_group_name: string;
  ren_ling_user?: {
    id: number;
    username: string;
  };
  labels_map: Record<string, string>;
  annotations_map: Record<string, string>;
}

export interface GetAlertEventsListParams {
  page: number;
  size: number;
  search?: string;
  status?: 'firing' | 'silenced' | 'claimed' | 'resolved';
  rule_id?: number;
  send_group_id?: number;
  start_time?: string;
  end_time?: string;
  alert_name?: string;
}

export interface EventAlertSilenceParams {
  id: number;
  use_name?: 1 | 2;
  time?: string;
}

export interface EventAlertClaimParams {
  id: number;
}

export interface EventAlertUnSilenceParams {
  id: number;
}
export async function getAlertEventsListApi(data: GetAlertEventsListParams) {
  return requestClient.get(`/monitor/alert_events/list`, { params: data });
}

export async function silenceAlertApi(data: EventAlertSilenceParams) {
  return requestClient.post(`/monitor/alert_events/silence/${data.id}`, {
    use_name: data.use_name,
    time: data.time,
  });
}

export async function claimAlertApi(data: EventAlertClaimParams) {
  return requestClient.post(`/monitor/alert_events/claim/${data.id}`);
}

export async function cancelSilenceAlertApi(data: EventAlertUnSilenceParams) {
  return requestClient.post(`/monitor/alert_events/unsilence/${data.id}`);
}
