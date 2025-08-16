import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:wrench',
      order: 14,
      title: '自动修复',
    },
    name: 'AutoFix',
    path: '/autofix',
    children: [
      {
        name: 'AutofixDiagnose',
        path: 'diagnose',
        component: () => import('#/views/autofix/AutofixDiagnose.vue'),
        meta: {
          icon: 'lucide:search',
          title: '问题诊断',
        },
      },
      {
        name: 'AutofixOperation',
        path: 'operation',
        component: () => import('#/views/autofix/AutofixOperation.vue'),
        meta: {
          icon: 'lucide:play',
          title: '修复操作',
        },
      },
      {
        name: 'AutofixTasks',
        path: 'tasks',
        component: () => import('#/views/autofix/AutofixTasks.vue'),
        meta: {
          icon: 'lucide:plus-circle',
          title: '任务管理',
        },
      },
      {
        name: 'AutofixRecords',
        path: 'records',
        component: () => import('#/views/autofix/AutofixRecords.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '修复记录',
        },
      },
      {
        name: 'AutofixRecordDetail',
        path: 'records/:id',
        component: () => import('#/views/autofix/AutofixRecordDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-search',
          title: '记录详情',
        },
      },
      {
        name: 'AutofixHistory',
        path: 'history',
        component: () => import('#/views/autofix/AutofixHistory.vue'),
        meta: {
          icon: 'lucide:history',
          title: '修复历史',
        },
      },
      {
        name: 'AutofixNotification',
        path: 'notification',
        component: () => import('#/views/autofix/AutofixNotification.vue'),
        meta: {
          icon: 'lucide:bell',
          title: '通知管理',
        },
      },
      {
        name: 'AutofixHealth',
        path: 'health',
        component: () => import('#/views/autofix/AutofixHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '服务健康',
        },
      },
    ],
  },
];

export default routes;
