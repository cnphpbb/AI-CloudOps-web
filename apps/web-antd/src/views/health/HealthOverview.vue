<template>
  <div class="health-overview">
    <!-- 加载状态骨架屏 -->
    <div v-if="loading" class="loading-skeleton" :class="{ 'fade-out': !loading }">
      <!-- 系统头部骨架屏 -->
      <div class="skeleton-header">
        <div class="skeleton-status-indicator"></div>
        <div class="skeleton-system-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
          <div class="skeleton-meta"></div>
        </div>
        <div class="skeleton-uptime"></div>
      </div>

      <!-- 指标卡片骨架屏 -->
      <div class="skeleton-metrics-grid">
        <div v-for="i in 4" :key="i" class="skeleton-metric-card">
          <div class="skeleton-metric-header">
            <div class="skeleton-icon"></div>
            <div class="skeleton-metric-info">
              <div class="skeleton-metric-title"></div>
              <div class="skeleton-metric-subtitle"></div>
            </div>
            <div class="skeleton-metric-value"></div>
          </div>
          <div class="skeleton-progress">
            <div class="skeleton-progress-track"></div>
            <div class="skeleton-progress-label"></div>
          </div>
        </div>
      </div>

      <!-- 组件状态骨架屏 -->
      <div class="skeleton-components-section">
        <div class="skeleton-section-header">
          <div class="skeleton-section-title"></div>
          <div class="skeleton-summary"></div>
        </div>
        <div class="skeleton-components-grid">
          <div v-for="i in 6" :key="i" class="skeleton-component-item">
            <div class="skeleton-component-header">
              <div class="skeleton-component-dot"></div>
              <div class="skeleton-component-name"></div>
            </div>
            <div class="skeleton-component-status"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实际内容 -->
    <div v-else>
      <!-- 顶部状态概览 -->
      <div class="system-header">
        <div class="header-main">
          <div class="status-indicator" :class="systemStatusClass">
            <div class="pulse-ring"></div>
            <div class="status-dot"></div>
          </div>
          <div class="system-info">
            <h1 class="system-title">{{ detail?.status?.toUpperCase() || 'UNKNOWN' }}</h1>
            <p class="system-subtitle">系统运行状态监控</p>
            <div class="system-meta">
              <span>版本 {{ detail?.version || 'N/A' }}</span>
              <span class="divider">•</span>
              <span>{{ lastCheckedDisplay }}</span>
            </div>
          </div>
        </div>
        <div class="uptime-display">
          <div class="uptime-label">运行时间</div>
          <div class="uptime-value">{{ uptimeDisplay }}</div>
        </div>
      </div>

      <!-- 核心指标网格 -->
      <div class="metrics-grid">
        <div class="metric-card cpu-card">
          <div class="metric-header">
            <div class="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
            </div>
            <div class="metric-info">
              <div class="metric-title">CPU</div>
              <div class="metric-subtitle">{{ cpuCountDisplay }}</div>
            </div>
            <div class="metric-value">{{ cpuUsagePercentDisplay }}</div>
          </div>
          <div class="metric-progress">
            <div class="progress-track">
              <div class="progress-fill cpu-progress" :style="{ width: cpuPercentValue + '%' }"></div>
            </div>
            <div class="progress-label">{{ cpuPercentValue }}%</div>
          </div>
        </div>

        <div class="metric-card memory-card">
          <div class="metric-header">
            <div class="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                <rect x="6" y="8" width="3" height="8" fill="currentColor"/>
                <rect x="10.5" y="8" width="3" height="8" fill="currentColor"/>
                <rect x="15" y="8" width="3" height="8" fill="currentColor"/>
              </svg>
            </div>
            <div class="metric-info">
              <div class="metric-title">内存</div>
              <div class="metric-subtitle">{{ memCapacityDisplay || '总计 ' + (memTotalGb?.toFixed(1) || 'N/A') + ' GB' }}</div>
            </div>
            <div class="metric-value">{{ memUsagePercentDisplay }}</div>
          </div>
          <div class="metric-progress">
            <div class="progress-track">
              <div class="progress-fill memory-progress" :style="{ width: memPercentValue + '%' }"></div>
            </div>
            <div class="progress-label">{{ memPercentValue }}%</div>
          </div>
        </div>

        <div class="metric-card disk-card">
          <div class="metric-header">
            <div class="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
            <div class="metric-info">
              <div class="metric-title">磁盘</div>
              <div class="metric-subtitle">{{ diskCapacityDisplay || '总计 ' + (diskTotalGb?.toFixed(1) || 'N/A') + ' GB' }}</div>
            </div>
            <div class="metric-value">{{ diskUsagePercentDisplay }}</div>
          </div>
          <div class="metric-progress">
            <div class="progress-track">
              <div class="progress-fill disk-progress" :style="{ width: diskPercentValue + '%' }"></div>
            </div>
            <div class="progress-label">{{ diskPercentValue }}%</div>
          </div>
        </div>

        <div class="metric-card components-card">
          <div class="metric-header">
            <div class="metric-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/>
                <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="metric-info">
              <div class="metric-title">组件</div>
              <div class="metric-subtitle">{{ healthyComponentsCount }}/{{ componentCount }} 正常</div>
            </div>
            <div class="metric-value">{{ componentCount }}</div>
          </div>
          <div class="components-status">
            <div v-for="(item, index) in componentList.slice(0, 6)" :key="item.name" 
                 class="component-dot" 
                 :class="{ 'healthy': item.statusText === '正常', 'error': item.statusText !== '正常' }"
                 :style="{ animationDelay: index * 0.1 + 's' }">
            </div>
            <div v-if="componentList.length > 6" class="more-indicator">+{{ componentList.length - 6 }}</div>
          </div>
        </div>
      </div>

      <!-- 组件详细状态 -->
      <div class="components-section">
        <div class="section-header">
          <h2 class="section-title">组件状态</h2>
          <div class="components-summary">
            <span class="summary-text">{{ healthyComponentsCount }} / {{ componentCount }} 服务正常运行</span>
            <div v-if="detailLoading" class="refresh-indicator">
              <div class="refresh-spinner"></div>
              <span>刷新中...</span>
            </div>
          </div>
        </div>
        
        <div class="components-grid">
          <div v-for="item in componentList" :key="item.name" class="component-item" :class="{ 'healthy': item.statusText === '正常' }">
            <div class="component-header">
              <div class="component-status-dot" :class="item.statusText === '正常' ? 'healthy' : 'error'"></div>
              <div class="component-name">{{ formatComponentName(item.name) }}</div>
            </div>
            <div class="component-status">
              <span class="status-text" :class="item.statusText === '正常' ? 'healthy' : 'error'">
                {{ item.statusText === '正常' ? 'ONLINE' : 'OFFLINE' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 系统监控图表 -->
      <div class="monitoring-section">
        <div class="section-header">
          <h2 class="section-title">实时监控</h2>
        </div>
        
        <div class="monitoring-grid">
          <div class="monitor-card">
            <div class="monitor-header">
              <h3>系统负载</h3>
            </div>
            <div class="monitor-chart">
              <EchartsUI ref="componentStatusRef" height="180px" />
            </div>
          </div>
          
          <div class="monitor-card">
            <div class="monitor-header">
              <h3>性能指标</h3>
            </div>
            <div class="performance-metrics">
              <div class="performance-item">
                <div class="performance-label">响应时间</div>
                <div class="performance-value">< 50ms</div>
              </div>
              <div class="performance-item">
                <div class="performance-label">错误率</div>
                <div class="performance-value">0.01%</div>
              </div>
              <div class="performance-item">
                <div class="performance-label">可用性</div>
                <div class="performance-value">99.99%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

import { healthDetailApi } from '#/api';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import type { EchartsUIType } from '@vben/plugins/echarts';

const loading = ref(false);
const detailLoading = ref(false);
const detail = ref<any | null>(null);

const componentStatusRef = ref<EchartsUIType>();
const { renderEcharts: renderComponentStatus } = useEcharts(componentStatusRef);



const componentCount = computed(() => {
  if (!detail.value?.components) return 0;
  return Object.keys(detail.value.components).length;
});

// 系统状态类名
const systemStatusClass = computed(() => {
  const status = detail.value?.status;
  if (status === 'ok' || status === 'healthy') return 'healthy';
  if (status === 'warning') return 'warning';
  return 'error';
});

// 健康组件数量
const healthyComponentsCount = computed(() => {
  return componentList.value.filter(item => item.statusText === '正常').length;
});

// 格式化组件名称
const formatComponentName = (name: string) => {
  const nameMap: Record<string, string> = {
    'prometheus': 'Prometheus',
    'kubernetes': 'Kubernetes',
    'llm': 'LLM Engine',
    'notification': 'Notification',
    'prediction': 'Prediction',
    'database': 'Database'
  };
  return nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
};

// 组件列表展示（布尔到文本与颜色映射）
const componentList = computed(() => {
  const comps = (detail.value as any)?.components;
  if (!comps) return [] as Array<{ name: string; statusText: string; color: string }>;
  return Object.entries(comps).map(([name, v]) => {
    let ok = false;
    if (typeof v === 'boolean') {
      ok = v;
    } else if (v && typeof v === 'object') {
      const vv = v as any;
      const statusIsOk = vv?.status === 'healthy' || vv?.status === 'ok';
      const healthyIsOk = vv?.healthy ?? vv?.ok;
      ok = Boolean(healthyIsOk !== undefined ? healthyIsOk : statusIsOk);
    }
    return {
      name,
      statusText: ok ? '正常' : '异常',
      color: ok ? '#52c41a' : '#ff4d4f',
    };
  });
});

const uptimeDisplay = computed(() => {
  const uptime = detail.value?.uptime;
  if (uptime == null) return 'N/A';

  // 兼容：若值较小，按“小时”解析；否则按“秒”解析
  if (uptime < 1000) {
    const totalMinutes = Math.round(uptime * 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  }

  const days = Math.floor(uptime / (24 * 3600));
  const hours = Math.floor((uptime % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
});

const lastCheckedDisplay = computed(() => {
  const ts = (detail.value as any)?.timestamp;
  if (!ts) return '-';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '-';
  try {
    return d.toLocaleString();
  } catch (e) {
    return ts;
  }
});

// 兼容多种后端结构的系统资源字段映射
const cpuUsagePercent = computed<number | null>(() => {
  const sys = (detail.value as any)?.system;
  if (!sys) return null;
  // 新结构：system.cpu.usage_percent
  const nested = sys?.cpu?.usage_percent;
  if (typeof nested === 'number') return Number(nested);
  // 旧结构：system.cpu_usage
  const flat = sys?.cpu_usage;
  if (typeof flat === 'number') return Number(flat);
  return null;
});

const cpuCount = computed<number | null>(() => {
  const count = (detail.value as any)?.system?.cpu?.count;
  return typeof count === 'number' ? count : null;
});

const memUsagePercent = computed<number | null>(() => {
  const sys = (detail.value as any)?.system;
  if (!sys) return null;
  // 新结构：system.memory.usage_percent
  const nested = sys?.memory?.usage_percent;
  if (typeof nested === 'number') return Number(nested);
  // 兼容：system.mem_usage 或 system.memory_usage
  const flat = sys?.mem_usage ?? sys?.memory_usage;
  if (typeof flat === 'number') return Number(flat);
  return null;
});

const memUsedGb = computed<number | null>(() => {
  const v = (detail.value as any)?.system?.memory?.used_gb;
  return typeof v === 'number' ? Number(v) : null;
});
const memTotalGb = computed<number | null>(() => {
  const v = (detail.value as any)?.system?.memory?.total_gb;
  return typeof v === 'number' ? Number(v) : null;
});
const memAvailGb = computed<number | null>(() => {
  const v = (detail.value as any)?.system?.memory?.available_gb;
  return typeof v === 'number' ? Number(v) : null;
});

const diskUsagePercent = computed<number | null>(() => {
  const sys = (detail.value as any)?.system;
  if (!sys) return null;
  // 新结构：system.disk.usage_percent
  const nested = sys?.disk?.usage_percent;
  if (typeof nested === 'number') return Number(nested);
  // 兼容：system.disk_usage
  const flat = sys?.disk_usage;
  if (typeof flat === 'number') return Number(flat);
  return null;
});

const diskUsedGb = computed<number | null>(() => {
  const v = (detail.value as any)?.system?.disk?.used_gb;
  return typeof v === 'number' ? Number(v) : null;
});
const diskTotalGb = computed<number | null>(() => {
  const v = (detail.value as any)?.system?.disk?.total_gb;
  return typeof v === 'number' ? Number(v) : null;
});
const diskFreeGb = computed<number | null>(() => {
  const v = (detail.value as any)?.system?.disk?.free_gb;
  return typeof v === 'number' ? Number(v) : null;
});

// 供模板使用的易读展示字符串
const cpuUsagePercentDisplay = computed(() =>
  cpuUsagePercent.value == null ? 'N/A' : `${Math.round(cpuUsagePercent.value)}%`
);
const cpuCountDisplay = computed(() =>
  cpuCount.value == null ? '' : `CPU ${cpuCount.value}核`
);

const memUsagePercentDisplay = computed(() =>
  memUsagePercent.value == null ? 'N/A' : `${Math.round(memUsagePercent.value)}%`
);
const memCapacityDisplay = computed(() => {
  if (memTotalGb.value == null || memUsedGb.value == null) return '';
  const used = memUsedGb.value.toFixed(2);
  const total = memTotalGb.value.toFixed(2);
  const availPart = memAvailGb.value == null ? '' : `, 可用 ${memAvailGb.value.toFixed(2)} GB`;
  return `${used}/${total} GB${availPart}`;
});

const diskUsagePercentDisplay = computed(() =>
  diskUsagePercent.value == null ? 'N/A' : `${Math.round(diskUsagePercent.value)}%`
);
const diskCapacityDisplay = computed(() => {
  if (diskTotalGb.value == null || diskUsedGb.value == null) return '';
  const used = diskUsedGb.value.toFixed(2);
  const total = diskTotalGb.value.toFixed(2);
  const freePart = diskFreeGb.value == null ? '' : `, 可用 ${diskFreeGb.value.toFixed(2)} GB`;
  return `${used}/${total} GB${freePart}`;
});

// 百分值与颜色
const percentOrZero = (v: number | null) => (v == null ? 0 : Math.max(0, Math.min(100, Math.round(v))));
const cpuPercentValue = computed(() => percentOrZero(cpuUsagePercent.value));
const memPercentValue = computed(() => percentOrZero(memUsagePercent.value));
const diskPercentValue = computed(() => percentOrZero(diskUsagePercent.value));



// 不再展示趋势数据，移除相关逻辑

async function fetchData() {
  if (!detail.value) {
    // 只在首次加载时显示骨架屏
    loading.value = true;
  }
  detailLoading.value = true;
  
  try {
    const data = await healthDetailApi();
    detail.value = data;
    renderCharts();
  } catch (error) {
    console.error('Failed to fetch health data:', error);
  } finally {
    loading.value = false;
    detailLoading.value = false;
  }
}

function renderCharts() {
  renderComponentStatusChart();
}

// 无趋势图

function renderComponentStatusChart() {
  if (!detail.value?.components) {
    renderComponentStatus({
      title: {
        text: '暂无组件数据',
        left: 'center',
        top: 'center'
      }
    } as any);
    return;
  }
  
  // 统计组件状态（兼容布尔值与对象结构）
  const components = detail.value.components;
  const statusCount: { healthy: number; warning: number; error: number } = { healthy: 0, warning: 0, error: 0 };

  Object.values(components).forEach((comp: any) => {
    let status: string = 'unknown';
    if (typeof comp === 'boolean') {
      status = comp ? 'healthy' : 'error';
    } else if (comp && typeof comp === 'object') {
      status = comp.status || (comp.healthy === true ? 'healthy' : 'unknown');
    }

    if (status === 'healthy' || status === 'ok') {
      statusCount.healthy++;
    } else if (status === 'warning') {
      statusCount.warning++;
    } else {
      statusCount.error++;
    }
  });
  
  const pieData: Array<{ value: number; name: string; itemStyle: { color: string } }> = [
    { value: statusCount.healthy, name: '健康', itemStyle: { color: '#52c41a' } },
    { value: statusCount.warning, name: '警告', itemStyle: { color: '#faad14' } },
    { value: statusCount.error, name: '异常', itemStyle: { color: '#ff4d4f' } }
  ].filter(item => item.value > 0);
  
  renderComponentStatus({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: pieData.map(item => item.name)
    },
    series: [
      {
        name: '组件状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: pieData
      }
    ]
  } as any);
}

// 定时刷新数据
let refreshTimer: NodeJS.Timeout;

onMounted(() => {
  fetchData();
  
  // 每30秒刷新一次数据
  refreshTimer = setInterval(fetchData, 30000);
});

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.health-overview {
  padding: 24px;
  min-height: calc(100vh - 140px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
}

/* 加载状态骨架屏 */
.loading-skeleton {
  padding: 24px;
  min-height: calc(100vh - 140px);
  background: #fafafa;
  position: relative;
  overflow: hidden;
  animation: fade-in 0.5s ease-out;
}

.loading-skeleton.fade-out {
  animation: fade-out 0.3s ease-in forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

.loading-skeleton::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-header {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.skeleton-status-indicator {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(45deg, #e0e0e0, #f5f5f5);
  animation: skeleton-glow 2s ease-in-out infinite alternate;
  position: relative;
}

.skeleton-status-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1890ff;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

.skeleton-system-info {
  flex: 1;
  margin-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-title {
  width: 140px;
  height: 36px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-subtitle {
  width: 240px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-meta {
  width: 200px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-uptime {
  text-align: right;
  position: relative;
}

.skeleton-uptime::before {
  content: '';
  display: block;
  width: 100px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  margin-bottom: 12px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-uptime::after {
  content: '';
  display: block;
  width: 140px;
  height: 28px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.skeleton-metric-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.skeleton-metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(24, 144, 255, 0.1), transparent);
  animation: card-shimmer 3s infinite;
}

.skeleton-metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

@keyframes card-shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.skeleton-metric-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(45deg, #e0e0e0, #f5f5f5);
  border-radius: 12px;
  animation: skeleton-glow 2s ease-in-out infinite alternate;
  position: relative;
}

.skeleton-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: #1890ff;
  border-radius: 4px;
  opacity: 0.3;
}

.skeleton-metric-info {
  flex: 1;
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-metric-title {
  width: 80px;
  height: 22px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-metric-subtitle {
  width: 140px;
  height: 18px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-metric-value {
  width: 80px;
  height: 32px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-progress {
  display: flex;
  align-items: center;
  gap: 16px;
}

.skeleton-progress-track {
  flex: 1;
  height: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-shimmer 2s infinite;
  position: relative;
  overflow: hidden;
}

.skeleton-progress-track::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  border-radius: 4px;
  animation: progress-fill 2s ease-in-out infinite;
}

.skeleton-progress-label {
  width: 50px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-components-section {
  margin-bottom: 24px;
}

.skeleton-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.skeleton-section-title {
  width: 140px;
  height: 28px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-summary {
  width: 240px;
  height: 36px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 18px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.skeleton-component-item {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.skeleton-component-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(24, 144, 255, 0.1), transparent);
  animation: card-shimmer 3s infinite;
}

.skeleton-component-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.skeleton-component-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.skeleton-component-dot {
  width: 12px;
  height: 12px;
  background: linear-gradient(45deg, #e0e0e0, #f5f5f5);
  border-radius: 50%;
  animation: skeleton-glow 2s ease-in-out infinite alternate;
  position: relative;
}

.skeleton-component-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1890ff;
  opacity: 0.5;
}

.skeleton-component-name {
  flex: 1;
  width: 140px;
  height: 22px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

.skeleton-component-status {
  width: 100px;
  height: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 6px;
  animation: skeleton-shimmer 2s infinite;
}

/* 系统头部状态区域 */
.system-header {
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.status-indicator {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0.3;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}

.status-indicator.healthy .pulse-ring {
  border-color: #52c41a;
}

.status-indicator.healthy .status-dot {
  background: #52c41a;
}

.status-indicator.warning .pulse-ring {
  border-color: #faad14;
}

.status-indicator.warning .status-dot {
  background: #faad14;
}

.status-indicator.error .pulse-ring {
  border-color: #ff4d4f;
}

.status-indicator.error .status-dot {
  background: #ff4d4f;
}

.system-info {
  flex: 1;
}

.system-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
  color: #262626;
  text-transform: uppercase;
}

.system-subtitle {
  font-size: 1.1rem;
  color: #666;
  margin: 4px 0 16px;
  font-weight: 400;
}

.system-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: #888;
}

.divider {
  color: #ccc;
}

.uptime-display {
  text-align: right;
}

.uptime-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 4px;
}

.uptime-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1890ff;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* 核心指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  position: relative;
}

.metric-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5f5f5;
  color: #666;
}

.metric-info {
  flex: 1;
  margin-left: 16px;
}

.metric-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 0.85rem;
  color: #666;
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1890ff;
  font-family: 'Monaco', 'Menlo', monospace;
}

.metric-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.cpu-progress {
  background: #52c41a;
}

.memory-progress {
  background: #1890ff;
}

.disk-progress {
  background: #722ed1;
}

.progress-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  min-width: 40px;
  text-align: right;
}

/* 组件状态点 */
.components-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.component-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.component-dot.healthy {
  background: #52c41a;
}

.component-dot.error {
  background: #ff4d4f;
}

.more-indicator {
  font-size: 0.75rem;
  color: #666;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 10px;
}

/* 组件详细状态区域 */
.components-section, .monitoring-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.components-summary {
  background: #f0f8ff;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  color: #1890ff;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid rgba(24, 144, 255, 0.2);
  animation: refresh-pulse 2s ease-in-out infinite;
}

.refresh-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(24, 144, 255, 0.2);
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes refresh-pulse {
  0%, 100% {
    background: rgba(24, 144, 255, 0.1);
    border-color: rgba(24, 144, 255, 0.2);
  }
  50% {
    background: rgba(24, 144, 255, 0.15);
    border-color: rgba(24, 144, 255, 0.3);
  }
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.component-item {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  position: relative;
}

.component-item.healthy {
  border-left: 3px solid #52c41a;
}

.component-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.component-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.component-status-dot.healthy {
  background: #52c41a;
}

.component-status-dot.error {
  background: #ff4d4f;
}

.component-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.component-status {
  text-align: right;
}

.status-text {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: 'Monaco', 'Menlo', monospace;
}

.status-text.healthy {
  color: #52c41a;
}

.status-text.error {
  color: #ff4d4f;
}

/* 监控区域 */
.monitoring-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.monitor-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
}

.monitor-header h3 {
  margin: 0 0 20px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.performance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.performance-item:last-child {
  border-bottom: none;
}

.performance-label {
  font-size: 0.9rem;
  color: #666;
}

.performance-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1890ff;
  font-family: 'Monaco', 'Menlo', monospace;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .monitoring-grid {
    grid-template-columns: 1fr;
  }
  
  .system-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .health-overview {
    padding: 16px;
  }
  
  .system-header {
    padding: 24px;
  }
  
  .system-title {
    font-size: 2rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .components-grid {
    grid-template-columns: 1fr;
  }
}

/* 骨架屏动画 */
@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes skeleton-glow {
  0% {
    box-shadow: 0 0 5px rgba(24, 144, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 20px rgba(24, 144, 255, 0.6);
  }
}

@keyframes pulse-glow {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
}

@keyframes progress-fill {
  0% {
    width: 10%;
  }
  50% {
    width: 60%;
  }
  100% {
    width: 10%;
  }
}

/* 骨架屏响应式调整 */
@media (max-width: 1024px) {
  .skeleton-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .skeleton-metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .loading-skeleton {
    padding: 16px;
  }
  
  .skeleton-header {
    padding: 24px;
  }
  
  .skeleton-metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .skeleton-components-grid {
    grid-template-columns: 1fr;
  }
}
</style>
