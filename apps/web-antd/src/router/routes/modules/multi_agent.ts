import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:users',
      order: 15,
      title: '多agent智能体',
    },
    name: 'MultiAgent',
    path: '/multi-agent',
    children: [
      {
        name: 'MultiAgentDashboard',
        path: 'dashboard',
        component: () => import('#/views/multi_agent/MultiAgentDashboard.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: '智能体总览',
        },
      },
      {
        name: 'AgentManagement',
        path: 'agents',
        component: () => import('#/views/multi_agent/AgentManagement.vue'),
        meta: {
          icon: 'lucide:bot',
          title: '智能体管理',
        },
      },
      {
        name: 'TaskExecution',
        path: 'tasks',
        component: () => import('#/views/multi_agent/TaskExecution.vue'),
        meta: {
          icon: 'lucide:play',
          title: '任务执行',
        },
      },
      {
        name: 'RepairTasks',
        path: 'repairs',
        component: () => import('#/views/multi_agent/RepairTasks.vue'),
        meta: {
          icon: 'lucide:wrench',
          title: '修复任务',
        },
      },
      {
        name: 'ClusterAnalysis',
        path: 'analysis',
        component: () => import('#/views/multi_agent/ClusterAnalysis.vue'),
        meta: {
          icon: 'lucide:search',
          title: '集群分析',
        },
      },
      {
        name: 'WorkflowManagement',
        path: 'workflows',
        component: () => import('#/views/multi_agent/WorkflowManagement.vue'),
        meta: {
          icon: 'lucide:workflow',
          title: '工作流管理',
        },
      },
      {
        name: 'WorkflowDetail',
        path: 'workflows/:recordId',
        component: () => import('#/views/multi_agent/WorkflowDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-search',
          title: '工作流详情',
        },
      },
      {
        name: 'CoordinatorStatus',
        path: 'coordinator-status',
        component: () => import('#/views/multi_agent/CoordinatorStatus.vue'),
        meta: {
          icon: 'lucide:network',
          title: '协调器状态',
        },
      },
      {
        name: 'SystemStatus',
        path: 'system-status',
        component: () => import('#/views/multi_agent/SystemStatus.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '系统状态',
        },
      },
      {
        name: 'CoordinationDetail',
        path: 'coordination',
        component: () => import('#/views/multi_agent/CoordinationDetail.vue'),
        meta: {
          icon: 'lucide:git-merge',
          title: '协调详情',
        },
      },
      {
        name: 'MultiAgentMetrics',
        path: 'metrics',
        component: () => import('#/views/multi_agent/MultiAgentMetrics.vue'),
        meta: {
          icon: 'lucide:gauge',
          title: '性能指标',
        },
      },
      {
        name: 'MultiAgentHealth',
        path: 'health',
        component: () => import('#/views/multi_agent/MultiAgentHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '服务健康',
        },
      },
    ],
  },
];

export default routes;
