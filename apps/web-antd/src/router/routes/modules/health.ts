import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:heart-pulse',
      order: 10,
      title: '健康检查',
    },
    name: 'Health',
    path: '/health',
    children: [
      {
        name: 'HealthOverview',
        path: 'overview',
        component: () => import('#/views/health/HealthOverview.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '健康概览',
        },
      },
      {
        name: 'SystemHealth',
        path: 'system',
        component: () => import('#/views/health/SystemHealth.vue'),
        meta: {
          icon: 'lucide:monitor',
          title: '系统健康',
        },
      },
      {
        name: 'K8sHealth',
        path: 'k8s',
        component: () => import('#/views/health/K8sHealth.vue'),
        meta: {
          icon: 'lucide:container',
          title: 'K8S健康',
        },
      },
      {
        name: 'PrometheusHealth',
        path: 'prometheus',
        component: () => import('#/views/health/PrometheusHealth.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: 'Prometheus健康',
        },
      },
      {
        name: 'SystemResource',
        path: 'resources',
        component: () => import('#/views/health/SystemResource.vue'),
        meta: {
          icon: 'lucide:cpu',
          title: '系统资源',
        },
      },
      {
        name: 'HealthRecords',
        path: 'records',
        component: () => import('#/views/health/HealthRecords.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '健康记录',
        },
      },
      {
        name: 'HealthRecordDetail',
        path: 'records/:id',
        component: () => import('#/views/health/HealthRecordDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-search',
          title: '记录详情',
        },
      },
    ],
  },
];

export default routes;
