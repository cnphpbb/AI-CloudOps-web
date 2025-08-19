<template>
  <div class="topology-management">
    <a-page-header
      title="拓扑图管理"
      sub-title="系统拓扑结构可视化与管理"
      class="page-header"
    >
      <template #extra>
        <a-space>
          <a-button @click="refreshTopology">
            <template #icon><reload-outlined /></template>
            刷新拓扑
          </a-button>
          <a-button type="primary" @click="showExportModal">
            <template #icon><download-outlined /></template>
            导出拓扑
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="24">
      <a-col :span="6">
        <a-card class="topology-controls">
          <template #title>
            <control-outlined />
            拓扑控制
          </template>
          
          <a-form layout="vertical" class="control-form">
            <a-form-item label="命名空间">
              <a-select 
                v-model:value="selectedNamespace" 
                placeholder="选择命名空间"
                @change="onNamespaceChange"
                style="width: 100%"
              >
                <a-select-option value="">全部</a-select-option>
                <a-select-option v-for="ns in namespaces" :key="ns" :value="ns">
                  {{ ns }}
                </a-select-option>
              </a-select>
            </a-form-item>
            
            <a-form-item label="最大跳数">
              <a-input-number 
                v-model:value="maxHops" 
                :min="1" 
                :max="10" 
                @change="onMaxHopsChange"
                style="width: 100%"
              />
            </a-form-item>
            
            <a-form-item label="方向">
              <a-radio-group v-model:value="direction" @change="onDirectionChange">
                <a-radio value="both">双向</a-radio>
                <a-radio value="in">入向</a-radio>
                <a-radio value="out">出向</a-radio>
              </a-radio-group>
            </a-form-item>
            
            <a-form-item label="布局算法">
              <a-select v-model:value="layoutAlgorithm" @change="updateLayout">
                <a-select-option value="force">力导向布局</a-select-option>
                <a-select-option value="hierarchical">层次布局</a-select-option>
                <a-select-option value="circular">环形布局</a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
          
          <a-divider />
          
          <div class="topology-stats">
            <a-statistic title="节点数量" :value="nodeCount" />
            <a-statistic title="连接数量" :value="edgeCount" style="margin-top: 16px" />
          </div>
        </a-card>
      </a-col>
      
      <a-col :span="18">
        <a-card class="topology-viewer" :loading="loading">
          <template #title>
            <apartment-outlined />
            拓扑视图
          </template>
          <template #extra>
            <a-space>
              <a-tooltip title="放大">
                <a-button size="small" @click="zoomIn">
                  <template #icon><zoom-in-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="缩小">
                <a-button size="small" @click="zoomOut">
                  <template #icon><zoom-out-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="适应屏幕">
                <a-button size="small" @click="fitToScreen">
                  <template #icon><fullscreen-outlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="重置位置">
                <a-button size="small" @click="resetPosition">
                  <template #icon><redo-outlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
          
          <div class="topology-container" ref="topologyContainer">
            <div v-if="!topologyData || (!topologyData.nodes.length && !loading)" class="empty-topology">
              <a-empty description="暂无拓扑数据">
                <template #image>
                  <apartment-outlined style="font-size: 64px; color: #d9d9d9" />
                </template>
              </a-empty>
            </div>
            <canvas ref="topologyCanvas" v-show="topologyData?.nodes.length"></canvas>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="24" style="margin-top: 24px">
      <a-col :span="12">
        <a-card title="节点信息" class="node-info-card">
          <template #extra>
            <database-outlined />
          </template>
          
          <div v-if="selectedNode" class="node-details">
            <a-descriptions :column="1" size="small">
              <a-descriptions-item label="节点ID">
                <a-tag color="blue">{{ selectedNode.id }}</a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="类型">
                <a-tag :color="getNodeTypeColor(selectedNode.type)">
                  {{ formatNodeType(selectedNode.type) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="名称">
                {{ selectedNode.name }}
              </a-descriptions-item>
              <a-descriptions-item label="命名空间">
                {{ selectedNode.namespace || '-' }}
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="getNodeStatusColor(selectedNode.status)">
                  {{ formatNodeStatus(selectedNode.status) }}
                </a-tag>
              </a-descriptions-item>
            </a-descriptions>
            
            <a-divider orientation="left">标签</a-divider>
            <div v-if="selectedNode.labels && Object.keys(selectedNode.labels).length">
              <a-space wrap>
                <a-tag 
                  v-for="(value, key) in selectedNode.labels" 
                  :key="key" 
                  size="small"
                >
                  {{ key }}: {{ value }}
                </a-tag>
              </a-space>
            </div>
            <a-empty v-else description="暂无标签" :image="false" />
            
            <a-divider orientation="left">指标</a-divider>
            <div v-if="selectedNode.metrics && Object.keys(selectedNode.metrics).length">
              <a-row :gutter="16">
                <a-col 
                  v-for="(value, key) in selectedNode.metrics" 
                  :key="key" 
                  :span="12"
                >
                  <a-statistic
                    :title="key"
                    :value="value"
                    :precision="2"
                    size="small"
                  />
                </a-col>
              </a-row>
            </div>
            <a-empty v-else description="暂无指标数据" :image="false" />
          </div>
          
          <a-empty v-else description="请选择一个节点查看详情" :image="false" />
        </a-card>
      </a-col>

      <a-col :span="12">
        <a-card title="连接关系" class="edges-info-card">
          <template #extra>
            <share-alt-outlined />
          </template>
          
          <div v-if="selectedNode">
            <a-tabs v-model:activeKey="activeTab">
              <a-tab-pane key="incoming" tab="入向连接">
                <a-list 
                  :data-source="getIncomingEdges(selectedNode.id)"
                  size="small"
                  class="edges-list"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta>
                        <template #title>
                          <a-space>
                            <a-tag size="small">{{ getNodeName(item.source) }}</a-tag>
                            <arrow-right-outlined />
                            <a-tag size="small">{{ getNodeName(item.target) }}</a-tag>
                          </a-space>
                        </template>
                        <template #description>
                          <a-space>
                            <span>关系：{{ item.relationship }}</span>
                            <span v-if="item.weight">权重：{{ item.weight }}</span>
                          </a-space>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
              
              <a-tab-pane key="outgoing" tab="出向连接">
                <a-list 
                  :data-source="getOutgoingEdges(selectedNode.id)"
                  size="small"
                  class="edges-list"
                >
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta>
                        <template #title>
                          <a-space>
                            <a-tag size="small">{{ getNodeName(item.source) }}</a-tag>
                            <arrow-right-outlined />
                            <a-tag size="small">{{ getNodeName(item.target) }}</a-tag>
                          </a-space>
                        </template>
                        <template #description>
                          <a-space>
                            <span>关系：{{ item.relationship }}</span>
                            <span v-if="item.weight">权重：{{ item.weight }}</span>
                          </a-space>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
            </a-tabs>
          </div>
          
          <a-empty v-else description="请选择一个节点查看连接关系" :image="false" />
        </a-card>
      </a-col>
    </a-row>
    
    <!-- 导出模态框 -->
    <a-modal
      v-model:open="exportModalVisible"
      title="导出拓扑图"
      @ok="exportTopology"
    >
      <a-form layout="vertical">
        <a-form-item label="导出格式">
          <a-radio-group v-model:value="exportFormat">
            <a-radio value="png">PNG 图片</a-radio>
            <a-radio value="svg">SVG 矢量图</a-radio>
            <a-radio value="json">JSON 数据</a-radio>
          </a-radio-group>
        </a-form-item>
        
        <a-form-item label="导出范围">
          <a-checkbox-group v-model:value="exportOptions">
            <a-checkbox value="nodes">包含节点信息</a-checkbox>
            <a-checkbox value="edges">包含连接信息</a-checkbox>
            <a-checkbox value="metadata">包含元数据</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  ReloadOutlined,
  DownloadOutlined,
  ControlOutlined,
  ApartmentOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  RedoOutlined,
  DatabaseOutlined,
  ShareAltOutlined,
  ArrowRightOutlined
} from '@ant-design/icons-vue';
import { getTopologyDetailApi } from '#/api/core/rca';
import type { TopologyGraph, TopologyNode, TopologyDetailReq } from '#/api/core/rca';

const topologyContainer = ref<HTMLElement>();
const topologyCanvas = ref<HTMLCanvasElement>();
const topologyData = ref<TopologyGraph | null>(null);
const selectedNode = ref<TopologyNode | null>(null);
const selectedNamespace = ref('');
const maxHops = ref(3);
const direction = ref('both');
const layoutAlgorithm = ref('force');
const loading = ref(false);
const activeTab = ref('incoming');
const namespaces = ref<string[]>(['default', 'kube-system', 'monitoring']);
const exportModalVisible = ref(false);
const exportFormat = ref('png');
const exportOptions = ref(['nodes', 'edges']);

const nodeCount = computed(() => topologyData.value?.nodes.length || 0);
const edgeCount = computed(() => topologyData.value?.edges.length || 0);

const loadTopology = async () => {
  loading.value = true;
  try {
    const params: TopologyDetailReq = {
      namespace: selectedNamespace.value || undefined,
      max_hops: maxHops.value,
      direction: direction.value
    };
    
    const response = await getTopologyDetailApi(params);
    if (response.data) {
      topologyData.value = response.data.topology;
      drawTopologyGraph();
    }
  } catch (error) {
    console.error('Failed to load topology:', error);
    message.error('加载拓扑数据失败');
  } finally {
    loading.value = false;
  }
};

const refreshTopology = () => {
  loadTopology();
};

const onNamespaceChange = () => {
  loadTopology();
};

const onMaxHopsChange = () => {
  loadTopology();
};

const onDirectionChange = () => {
  loadTopology();
};

const updateLayout = () => {
  drawTopologyGraph();
};

const formatNodeType = (type: string) => {
  const typeMap = {
    'pod': 'Pod',
    'service': '服务',
    'deployment': '部署',
    'node': '节点',
    'namespace': '命名空间'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const formatNodeStatus = (status: string) => {
  const statusMap = {
    'running': '运行中',
    'pending': '等待中',
    'failed': '失败',
    'succeeded': '成功'
  };
  return statusMap[status as keyof typeof statusMap] || status;
};

const getNodeTypeColor = (type: string) => {
  const colorMap = {
    'pod': 'blue',
    'service': 'green',
    'deployment': 'purple',
    'node': 'orange',
    'namespace': 'cyan'
  };
  return colorMap[type as keyof typeof colorMap] || 'default';
};

const getNodeStatusColor = (status: string) => {
  const colorMap = {
    'running': 'success',
    'pending': 'warning',
    'failed': 'error',
    'succeeded': 'success'
  };
  return colorMap[status as keyof typeof colorMap] || 'default';
};

const getNodeName = (nodeId: string) => {
  const node = topologyData.value?.nodes.find(n => n.id === nodeId);
  return node?.name || nodeId;
};

const getIncomingEdges = (nodeId: string) => {
  return topologyData.value?.edges.filter(edge => edge.target === nodeId) || [];
};

const getOutgoingEdges = (nodeId: string) => {
  return topologyData.value?.edges.filter(edge => edge.source === nodeId) || [];
};

const showExportModal = () => {
  exportModalVisible.value = true;
};

const exportTopology = () => {
  // 实现导出功能
  if (exportFormat.value === 'json') {
    const data = {
      nodes: exportOptions.value.includes('nodes') ? topologyData.value?.nodes : [],
      edges: exportOptions.value.includes('edges') ? topologyData.value?.edges : [],
      metadata: exportOptions.value.includes('metadata') ? topologyData.value?.metadata : {}
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topology.json';
    a.click();
    URL.revokeObjectURL(url);
  } else {
    // PNG/SVG 导出需要特殊处理
    message.info('图片导出功能开发中...');
  }
  
  exportModalVisible.value = false;
  message.success('导出成功');
};

const drawTopologyGraph = () => {
  if (!topologyCanvas.value || !topologyData.value) return;
  
  const canvas = topologyCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 设置画布尺寸
  canvas.width = 800;
  canvas.height = 500;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 简单的网络图绘制
  const nodes = topologyData.value.nodes;
  const edges = topologyData.value.edges;
  
  // 绘制连接
  ctx.strokeStyle = '#d9d9d9';
  ctx.lineWidth = 2;
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const sourceX = Math.random() * (canvas.width - 100) + 50;
      const sourceY = Math.random() * (canvas.height - 100) + 50;
      const targetX = Math.random() * (canvas.width - 100) + 50;
      const targetY = Math.random() * (canvas.height - 100) + 50;
      
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
    }
  });
  
  // 绘制节点
  nodes.forEach((node) => {
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = Math.random() * (canvas.height - 100) + 50;
    
    // 节点圆圈
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = getNodeColor(node.type);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 节点标签
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, x, y + 35);
  });
};

const getNodeColor = (type: string) => {
  const colorMap = {
    'pod': '#1890ff',
    'service': '#52c41a',
    'deployment': '#722ed1',
    'node': '#fa8c16',
    'namespace': '#13c2c2'
  };
  return colorMap[type as keyof typeof colorMap] || '#d9d9d9';
};

const zoomIn = () => {
  // 实现放大功能
  message.info('放大功能开发中...');
};

const zoomOut = () => {
  // 实现缩小功能
  message.info('缩小功能开发中...');
};

const fitToScreen = () => {
  // 实现适应屏幕功能
  message.info('适应屏幕功能开发中...');
};

const resetPosition = () => {
  // 实现重置位置功能
  drawTopologyGraph();
  message.success('位置已重置');
};

onMounted(() => {
  loadTopology();
});
</script>

<style scoped>
.topology-management {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.topology-controls,
.node-info-card,
.edges-info-card,
.topology-viewer {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.control-form {
  margin-top: 16px;
}

.topology-stats {
  text-align: center;
}

.topology-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: #fafafa;
  border-radius: 6px;
  overflow: hidden;
}

.empty-topology {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.topology-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.topology-canvas:active {
  cursor: grabbing;
}

.node-details {
  margin-top: 16px;
}

.edges-list {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.ant-card-head-title) {
  font-weight: 600;
  color: #262626;
}

:deep(.ant-descriptions-item-label) {
  font-weight: 500;
  color: #595959;
}

:deep(.ant-statistic-title) {
  font-size: 12px;
  margin-bottom: 8px;
  color: #8c8c8c;
}

:deep(.ant-statistic-content) {
  font-size: 16px;
  font-weight: 600;
}

:deep(.ant-page-header) {
  padding: 16px 24px;
}

@media (max-width: 768px) {
  .topology-management {
    padding: 16px;
  }
  
  .topology-container {
    height: 300px;
  }
  
  .control-form .ant-col,
  .node-info-card .ant-col,
  .edges-info-card .ant-col {
    margin-bottom: 16px;
  }
}
</style>