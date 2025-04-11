import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:ticket',
      order: -1,
      title: '工单管理',
    },
    name: 'WorkOrder',
    path: '/workorder',
    children: [
      {
        name: '工单管理',
        path: '/workorder_management',
        component: () => import('#/views/workorder/WorkOrderManagement.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: '工单管理',
        },
      },
      {
        name: '工单列表',
        path: '/workorder_list',
        component: () => import('#/views/workorder/WorkOrderList.vue'),
        meta: {
          icon: 'lucide:user',
          title: '工单列表',
        },
      },
      {
        name: '工单详情',
        path: '/workorder_detail',
        component: () => import('#/views/workorder/WorkOrderDetail.vue'),
        meta: {
          title: '工单详情',
          hideInMenu: true,
        },
      },
      {
        name: '工单统计',
        path: '/workorder_statistics',
        component: () => import('#/views/workorder/WorkOrderStatistics.vue'),
        meta: {
          icon: 'lucide:users',
          title: '工单统计',
        },
      },
    ],
  },
];

export default routes;
