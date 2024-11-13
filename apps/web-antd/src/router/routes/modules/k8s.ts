import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      order: 3,
      title: "k8s运维管理",
    },
    name: 'K8s',
    path: '/k8s',
    children: [
      {
        name: 'K8sCluster',
        path: '/k8s_cluster',
        component: () =>
          import('#/views/k8s/K8sCluster.vue'),
        meta: {
          title: "集群管理",
          icon: 'lucide:database',
        },
      },
      {
        name: 'K8sNode',
        path: '/k8s_node',
        component: () =>
          import('#/views/k8s/K8sNode.vue'),
        meta: {
          title: "节点管理",
          icon: 'lucide:list-check',
        },
      },
      {
        name: 'K8sNamespace',
        path: '/k8s_namespace',
        component: () =>
          import('#/views/k8s/K8sNamespace.vue'),
        meta: {
          title: "命名空间管理",
          icon: 'lucide:alert-triangle',
        },
      },
      
      {
        name: 'K8sTaint',
        path: '/k8s_taint',
        component: () =>
          import('#/views/k8s/K8sTaint.vue'),
        meta: {
          title: "污点管理",
          icon: 'lucide:badge-alert',
        },
      },
      {
        name: 'K8sPod',
        path: '/k8s_pod',
        component: () =>
          import('#/views/k8s/K8sPod.vue'),
        meta: {
          title: "Pod管理",
          icon: 'lucide:bell-ring',
        },
      },
      {
        name: 'K8sService',
        path: '/k8s_service',
        component: () =>
          import('#/views/k8s/K8sService.vue'),
        meta: {
          title: "Service管理",
          icon: 'lucide:box',
        },
      },
      {
        name: 'K8sDeployment',
        path: '/k8s_deployment',
        component: () =>
          import('#/views/k8s/K8sDeployment.vue'),
        meta: {
          title: "Deployment管理",
          icon: 'lucide:file-text',
        },
      },
      {
        name: 'K8sConfigMap',
        path: '/k8s_configmap',
        component: () =>
          import('#/views/k8s/K8sConfigmap.vue'),
        meta: {
          title: "ConfigMap管理",
          icon: 'lucide:user-round-minus'
        },
      },
      {
        name: 'K8sYamlTemplate',
        path: '/k8s_yaml_template',
        component: () =>
          import('#/views/k8s/K8sYamlTemplate.vue'),
        meta: {
          hideInMenu: true,
          title: "Yaml模板",
          icon: 'material-symbols:table-outline'
        },
      },
      {
        name: 'K8sYamlTask',
        path: '/k8s_yaml_task',
        component: () =>
          import('#/views/k8s/K8sYamlTask.vue'),
        meta: {
          title: "Yaml任务",
          icon: 'lucide:send-horizontal'
        },
      },
    ],
  },
];

export default routes;
