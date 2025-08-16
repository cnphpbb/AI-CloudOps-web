import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:bot',
      order: 11,
      title: '小助手',
    },
    name: 'Assistant',
    path: '/assistant',
    children: [
      {
        name: 'AssistantChat',
        path: 'chat',
        component: () => import('#/views/assistant/AssistantChat.vue'),
        meta: {
          icon: 'lucide:message-circle',
          title: '智能对话',
        },
      },
      {
        name: 'AssistantHistory',
        path: 'history',
        component: () => import('#/views/assistant/AssistantHistory.vue'),
        meta: {
          icon: 'lucide:history',
          title: '对话历史',
        },
      },
      {
        name: 'AssistantHistoryDetail',
        path: 'history/:id',
        component: () => import('#/views/assistant/AssistantHistoryDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-search',
          title: '历史详情',
        },
      },
      {
        name: 'AssistantKnowledge',
        path: 'knowledge',
        component: () => import('#/views/assistant/AssistantKnowledge.vue'),
        meta: {
          icon: 'lucide:book',
          title: '知识库管理',
        },
      },
      {
        name: 'AssistantKnowledgeDetail',
        path: 'knowledge/:id',
        component: () => import('#/views/assistant/AssistantKnowledgeDetail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:book-open',
          title: '知识详情',
        },
      },
      {
        name: 'AssistantSession',
        path: 'session',
        component: () => import('#/views/assistant/AssistantSession.vue'),
        meta: {
          icon: 'lucide:users',
          title: '会话管理',
        },
      },
      {
        name: 'AssistantFiles',
        path: 'files',
        component: () => import('#/views/assistant/AssistantFiles.vue'),
        meta: {
          icon: 'lucide:file-up',
          title: '文件管理',
        },
      },
      {
        name: 'AssistantSystem',
        path: 'system',
        component: () => import('#/views/assistant/AssistantSystem.vue'),
        meta: {
          icon: 'lucide:settings',
          title: '系统管理',
        },
      },
      {
        name: 'AssistantHealth',
        path: 'health',
        component: () => import('#/views/assistant/AssistantHealth.vue'),
        meta: {
          icon: 'lucide:heart-pulse',
          title: '服务健康',
        },
      },
    ],
  },
];

export default routes;
