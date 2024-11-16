import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      order: 3,
      title: 'k8s运维管理',
    },
    name: 'K8s',
    path: '/k8s',
    children: [
      {
        name: 'K8sCluster',
        path: '/k8s_cluster',
        component: () => import('#/views/k8s/K8sCluster.vue'),
        meta: {
          icon: 'lucide:database',
          title: '集群管理',
        },
      },
      {
        name: 'K8sNode',
        path: '/k8s_node',
        component: () => import('#/views/k8s/K8sNode.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:list-check',
          title: '节点管理',
        },
      },
      {
        name: 'K8sPod',
        path: '/k8s_pod',
        component: () => import('#/views/k8s/K8sPod.vue'),
        meta: {
          icon: 'lucide:bell-ring',
          title: 'Pod管理',
        },
      },
      {
        name: 'K8sService',
        path: '/k8s_service',
        component: () => import('#/views/k8s/K8sService.vue'),
        meta: {
          icon: 'lucide:box',
          title: 'Service管理',
        },
      },
      {
        name: 'K8sDeployment',
        path: '/k8s_deployment',
        component: () => import('#/views/k8s/K8sDeployment.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: 'Deployment管理',
        },
      },
      {
        name: 'K8sConfigMap',
        path: '/k8s_configmap',
        component: () => import('#/views/k8s/K8sConfigmap.vue'),
        meta: {
          icon: 'lucide:user-round-minus',
          title: 'ConfigMap管理',
        },
      },
      {
        name: 'K8sYamlTemplate',
        path: '/k8s_yaml_template',
        component: () => import('#/views/k8s/K8sYamlTemplate.vue'),
        meta: {
          icon: 'material-symbols:table-outline',
          title: 'Yaml模板',
        },
      },
      {
        name: 'K8sYamlTask',
        path: '/k8s_yaml_task',
        component: () => import('#/views/k8s/K8sYamlTask.vue'),
        meta: {
          icon: 'lucide:send-horizontal',
          title: 'Yaml任务',
        },
      },
    ],
  },
];

export default routes;
