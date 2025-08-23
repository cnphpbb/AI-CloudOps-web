import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:album',
      order: 20,
      title: '智能助手',
    },
    name: 'Assistant',
    path: '/assistant',
    children: [
      {
        name: 'AssistantSession',
        path: '/assistant/session',
        component: () => import('#/views/assistant/AssistantSession.vue'),
        meta: {
          icon: 'lucide:users',
          title: '会话管理',
        },
      },
      {
        name: 'AssistantKnowledge',
        path: '/assistant/knowledge',
        component: () => import('#/views/assistant/AssistantKnowledge.vue'),
        meta: {
          icon: 'lucide:book',
          title: '知识库管理',
        },
      },
      {
        name: 'AssistantHealth',
        path: '/assistant/health',
        component: () => import('#/views/assistant/AssistantHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '健康检查',
        },
      },
      {
        name: 'AssistantInfo',
        path: '/assistant/info',
        component: () => import('#/views/assistant/AssistantInfo.vue'),
        meta: {
          icon: 'lucide:info',
          title: '服务信息',
        },
      },
    ],
  },
];

export default routes;
