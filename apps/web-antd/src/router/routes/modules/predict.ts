import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:trending-up',
      order: 20,
      title: '预测服务',
    },
    name: 'Predict',
    path: '/predict',
    children: [
      {
        name: 'PredictDashboard',
        path: '/predict/dashboard',
        component: () => import('#/views/predict/PredictDashboard.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: '预测看板',
        },
      },
      {
        name: 'PredictAnalysis',
        path: '/predict/analysis',
        component: () => import('#/views/predict/PredictAnalysis.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '智能分析',
        },
      },
      {
        name: 'PredictHealth',
        path: '/predict/health',
        component: () => import('#/views/predict/PredictHealth.vue'),
        meta: {
          icon: 'lucide:heart',
          title: '服务监控',
        },
      },
    ],
  },
];

export default routes;
