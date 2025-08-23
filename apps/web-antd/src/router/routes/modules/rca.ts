import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:activity',
      order: 20,
      title: '根因分析',
    },
    name: 'RCA',
    path: '/rca',
    children: [
      {
        name: 'RCAAnalysis',
        path: '/rca/analysis',
        component: () => import('#/views/rca/RCAAnalysis.vue'),
        meta: {
          icon: 'lucide:search',
          title: '根因分析',
        },
      },
      {
        name: 'RCADiagnosis',
        path: '/rca/diagnosis',/*  */
        component: () => import('#/views/rca/RCADiagnosis.vue'),
        meta: {
          icon: 'lucide:stethoscope',
          title: '快速诊断',
        },
      },
      {
        name: 'RCAHealth',
        path: '/rca/health',
        component: () => import('#/views/rca/RCAHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '服务监控',
        },
      },
    ],
  },
];

export default routes;
