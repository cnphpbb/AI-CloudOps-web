import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:trending-up',
      order: 12,
      title: '实例预测',
    },
    name: 'Prediction',
    path: '/prediction',
    children: [
      {
        name: 'PredictionRecords',
        path: 'records',
        component: () => import('#/views/prediction/PredictionRecords.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '预测记录',
        },
      },
      {
        name: 'PredictionRecordDetail',
        path: 'records/:id',
        component: () => import('#/views/prediction/PredictionRecordDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-search',
          title: '记录详情',
        },
      },
      {
        name: 'ModelManagement',
        path: 'models',
        component: () => import('#/views/prediction/ModelManagement.vue'),
        meta: {
          icon: 'lucide:brain',
          title: '模型管理',
        },
      },
      {
        name: 'ModelDetail',
        path: 'models/:id',
        component: () => import('#/views/prediction/ModelDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:brain',
          title: '模型详情',
        },
      },
      {
        name: 'TrendPrediction',
        path: 'trends',
        component: () => import('#/views/prediction/TrendPrediction.vue'),
        meta: {
          icon: 'lucide:trending-up',
          title: '趋势预测',
        },
      },
      {
        name: 'TrendDetail',
        path: 'trends/:id',
        component: () => import('#/views/prediction/TrendDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:line-chart',
          title: '趋势详情',
        },
      },
      {
        name: 'PredictionHealth',
        path: 'health',
        component: () => import('#/views/prediction/PredictionHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '服务健康',
        },
      },
      {
        name: 'ServiceManagement',
        path: 'services',
        component: () => import('#/views/prediction/ServiceManagement.vue'),
        meta: {
          icon: 'lucide:settings',
          title: '服务管理',
        },
      },
    ],
  },
];

export default routes;
