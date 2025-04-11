<template>
  <div class="welcome-page dark">
    <!-- 顶部欢迎语 -->
    <div class="welcome-header">
      <h1 class="title">AI-CloudOps 智能运维平台</h1>
      <p class="subtitle">让云运维更智能、更高效</p>
      <div class="time-info">
        <a-space>
          <a-tag color="blue">{{ currentDate }}</a-tag>
          <a-tag color="green">当前时间: {{ currentTime }}</a-tag>
          <a-tag color="green">在线时长: 1小时内</a-tag>
        </a-space>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <div class="statistics-cards">
      <a-row :gutter="[16, 16]">
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <div class="stat-header">
              <span class="stat-title">AI 预测准确率</span>
              <a-tag color="success">同比上升8%</a-tag>
            </div>
            <div class="stat-body">
              <span class="stat-number">98.7%</span>
              <div ref="accuracyChart" style="width: 100px; height: 100px"></div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <div class="stat-header">
              <span class="stat-title">云资源使用率</span>
              <a-tag color="processing">优化建议</a-tag>
            </div>
            <div class="stat-body">
              <span class="stat-number">78.3%</span>
              <div ref="resourceChart" style="width: 100px; height: 100px"></div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <div class="stat-header">
              <span class="stat-title">系统健康度</span>
              <a-tag color="success">良好</a-tag>
            </div>
            <div class="stat-body">
              <span class="stat-number">95.2%</span>
              <div ref="healthChart" style="width: 100px; height: 100px"></div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card" :bordered="false">
            <div class="stat-header">
              <span class="stat-title">智能告警处理</span>
              <a-tag color="warning">3个待处理</a-tag>
            </div>
            <div class="stat-body">
              <span class="stat-number">89.5%</span>
              <div ref="alertChart" style="width: 100px; height: 100px"></div>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 运维概览 -->
    <div class="overview-section">
      <a-row :gutter="[16, 16]">
        <a-col :span="16">
          <a-card title="AI 智能运维分析" :bordered="false">
            <template #extra>
              <a-space>
                <a-radio-group v-model:value="timeRange" size="small" button-style="solid">
                  <a-radio-button value="day">今日</a-radio-button>
                  <a-radio-button value="week">本周</a-radio-button>
                  <a-radio-button value="month">本月</a-radio-button>
                </a-radio-group>
              </a-space>
            </template>
            <div ref="analysisChart" style="height: 300px"></div>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="实时监控动态" :bordered="false">
            <a-timeline>
              <a-timeline-item color="green">
                AI预测：系统负载将在2小时后达到峰值
                <div class="timeline-time">10分钟前</div>
              </a-timeline-item>
              <a-timeline-item color="blue">
                自动扩容：已添加2个新的服务节点
                <div class="timeline-time">30分钟前</div>
              </a-timeline-item>
              <a-timeline-item color="red">
                检测到异常流量，已自动启动防护
                <div class="timeline-time">1小时前</div>
              </a-timeline-item>
              <a-timeline-item color="gray">
                日常巡检完成，系统运行正常
                <div class="timeline-time">2小时前</div>
              </a-timeline-item>
            </a-timeline>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';

const currentDate = ref('');
const currentTime = ref('');

// 更新日期和时间
const updateDateTime = () => {
  const now = new Date();
  currentDate.value = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// 初始更新并设置定时器
updateDateTime();
setInterval(updateDateTime, 1000);

const timeRange = ref('day');

const accuracyChart = ref();
const resourceChart = ref();
const healthChart = ref();
const alertChart = ref();
const analysisChart = ref();

onMounted(() => {
  // 初始化圆环图表
  const initGaugeChart = (el: HTMLElement, value: number, color: string) => {
    const chart = echarts.init(el);
    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: {
          show: false
        },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            color
          }
        },
        axisLine: {
          lineStyle: {
            width: 10
          }
        },
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        data: [{
          value,
          name: '',
          detail: {
            show: false
          }
        }],
        detail: {
          show: false
        }
      }]
    });
  };

  // 初始化趋势图表
  const initAnalysisChart = () => {
    const chart = echarts.init(analysisChart.value);
    chart.setOption({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['系统负载', '资源使用', '告警数量'],
        textStyle: {
          color: '#a6a6a6'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
        axisLine: {
          lineStyle: {
            color: '#a6a6a6'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#a6a6a6'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#303030'
          }
        }
      },
      series: [
        {
          name: '系统负载',
          type: 'line',
          smooth: true,
          data: [30, 40, 35, 50, 45, 65, 55, 40]
        },
        {
          name: '资源使用',
          type: 'line',
          smooth: true,
          data: [45, 50, 40, 60, 55, 75, 65, 50]
        },
        {
          name: '告警数量',
          type: 'line',
          smooth: true,
          data: [5, 3, 4, 8, 6, 4, 3, 2]
        }
      ]
    });
  };

  initGaugeChart(accuracyChart.value, 98.7, '#87d068');
  initGaugeChart(resourceChart.value, 78.3, '#1890ff');
  initGaugeChart(healthChart.value, 95.2, '#87d068');
  initGaugeChart(alertChart.value, 89.5, '#ffc53d');
  initAnalysisChart();
});
</script>

<style scoped>
.welcome-page {
  padding: 24px;
  background: #141414;
  min-height: 100vh;
}

.welcome-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: #1f1f1f;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(120deg, #177ddc, #722ed1);
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 18px;
  color: #a6a6a6;
  margin-bottom: 16px;
}

.time-info {
  margin-top: 16px;
}

.stat-card {
  border-radius: 8px;
  background: #1f1f1f !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-title {
  font-size: 16px;
  color: #a6a6a6;
}

.stat-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #177ddc;
}

.overview-section {
  margin-top: 24px;
}

.timeline-time {
  font-size: 12px;
  color: #737373;
  margin-top: 4px;
}

:deep(.ant-card) {
  background: #1f1f1f;
  border: none;
  color: #fff;
}

:deep(.ant-card-head) {
  color: #fff;
  border-bottom: 1px solid #303030;
}

:deep(.ant-timeline-item-content) {
  color: #d9d9d9;
}
</style>
