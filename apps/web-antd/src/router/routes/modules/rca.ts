import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:search',
      order: 13,
      title: '根因分析',
    },
    name: 'RCA',
    path: '/rca',
    children: [
      {
        name: 'RCARecords',
        path: 'records',
        component: () => import('#/views/rca/RCARecords.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: 'RCA记录',
        },
      },
      {
        name: 'RCARecordDetail',
        path: 'records/:id',
        component: () => import('#/views/rca/RCARecordDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-search',
          title: '记录详情',
        },
      },
      {
        name: 'AnalysisTasks',
        path: 'analyses',
        component: () => import('#/views/rca/AnalysisTasks.vue'),
        meta: {
          icon: 'lucide:brain',
          title: '分析任务',
        },
      },
      {
        name: 'AnalysisTaskDetail',
        path: 'analyses/:jobId',
        component: () => import('#/views/rca/AnalysisTaskDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:brain',
          title: '任务详情',
        },
      },
      {
        name: 'AnomalyDetection',
        path: 'anomalies',
        component: () => import('#/views/rca/AnomalyDetection.vue'),
        meta: {
          icon: 'lucide:alert-triangle',
          title: '异常检测',
        },
      },
      {
        name: 'CorrelationAnalysis',
        path: 'correlations',
        component: () => import('#/views/rca/CorrelationAnalysis.vue'),
        meta: {
          icon: 'lucide:git-merge',
          title: '相关性分析',
        },
      },
      {
        name: 'CorrelationDetail',
        path: 'correlations/:jobId',
        component: () => import('#/views/rca/CorrelationDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:git-merge',
          title: '相关性详情',
        },
      },
      {
        name: 'CrossCorrelationAnalysis',
        path: 'cross-correlations',
        component: () => import('#/views/rca/CrossCorrelationAnalysis.vue'),
        meta: {
          icon: 'lucide:shuffle',
          title: '跨时滞相关分析',
        },
      },
      {
        name: 'CrossCorrelationDetail',
        path: 'cross-correlations/:jobId',
        component: () => import('#/views/rca/CrossCorrelationDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:shuffle',
          title: '跨时滞详情',
        },
      },
      {
        name: 'TimelineManagement',
        path: 'timelines',
        component: () => import('#/views/rca/TimelineManagement.vue'),
        meta: {
          icon: 'lucide:clock',
          title: '时间线管理',
        },
      },
      {
        name: 'TimelineDetail',
        path: 'timelines/:recordId',
        component: () => import('#/views/rca/TimelineDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:clock',
          title: '时间线详情',
        },
      },
      {
        name: 'MetricsManagement',
        path: 'metrics',
        component: () => import('#/views/rca/MetricsManagement.vue'),
        meta: {
          icon: 'lucide:gauge',
          title: '指标管理',
        },
      },
      {
        name: 'TopologyManagement',
        path: 'topology',
        component: () => import('#/views/rca/TopologyManagement.vue'),
        meta: {
          icon: 'lucide:network',
          title: '拓扑管理',
        },
      },
      {
        name: 'RCAHealth',
        path: 'health',
        component: () => import('#/views/rca/RCAHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '服务健康',
        },
      },
    ],
  },
];

export default routes;
