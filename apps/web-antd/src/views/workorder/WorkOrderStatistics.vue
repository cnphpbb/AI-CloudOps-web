<template>
  <div class="work-order-statistics dark">
    <div class="page-header">
      <h1>工单统计分析</h1>
    </div>

    <div class="statistics-cards">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">本月工单总量</span>
            </template>
            <div class="stat-number">{{ totalCount }}</div>
            <div class="stat-trend">
              <span class="trend-up">↑15%</span> 较上月
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">平均响应时间</span>
            </template>
            <div class="stat-number">1.8h</div>
            <div class="stat-trend">
              <span class="trend-down">↓20%</span> 较上月
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">完成率</span>
            </template>
            <div class="stat-number">92%</div>
            <div class="stat-trend">
              <span class="trend-up">↑5%</span> 较上月
            </div>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stat-card">
            <template #title>
              <span class="card-title">满意度</span>
            </template>
            <div class="stat-number">4.8</div>
            <div class="stat-trend">
              <span class="trend-up">↑0.2</span> 较上月
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="statistics-charts">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="工单类型分布" class="chart-card">
            <div ref="typeChartRef" class="chart"></div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="工单处理趋势" class="chart-card">
            <div ref="trendChartRef" class="chart"></div>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';

const totalCount = ref(156);
const typeChartRef = ref<HTMLElement>();
const trendChartRef = ref<HTMLElement>();

onMounted(() => {
  const typeChart = echarts.init(typeChartRef.value as HTMLElement);
  typeChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#fff'
      }
    },
    series: [
      {
        name: '工单类型',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 35, name: '系统故障' },
          { value: 30, name: '功能优化' },
          { value: 20, name: '性能问题' },
          { value: 15, name: '其他' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  });

  const trendChart = echarts.init(trendChartRef.value as HTMLElement);
  trendChart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新建工单', '完成工单'],
      textStyle: {
        color: '#fff'
      }
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLabel: {
        color: '#fff'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#fff'
      }
    },
    series: [
      {
        name: '新建工单',
        type: 'line',
        data: [12, 15, 10, 18, 14, 8, 6]
      },
      {
        name: '完成工单',
        type: 'line',
        data: [10, 13, 12, 15, 16, 7, 5]
      }
    ]
  });
});
</script>

<style scoped lang="less">
.work-order-statistics {
  padding: 24px;
  background: #141414;
  min-height: 100vh;

  .page-header {
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
    }
  }

  .statistics-cards {
    margin-bottom: 24px;

    .stat-card {
      border-radius: 8px;
      background: #1f1f1f;
      border: 1px solid #303030;

      :deep(.ant-card-head) {
        border-bottom: 1px solid #303030;
      }

      .card-title {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.85);
      }

      .stat-number {
        font-size: 24px;
        font-weight: 500;
        margin: 16px 0;
        color: rgba(255, 255, 255, 0.85);
      }

      .stat-trend {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.45);

        .trend-up {
          color: #52c41a;
        }

        .trend-down {
          color: #ff4d4f;
        }
      }
    }
  }

  .statistics-charts {
    .chart-card {
      background: #1f1f1f;
      border: 1px solid #303030;

      :deep(.ant-card-head) {
        color: rgba(255, 255, 255, 0.85);
        border-bottom: 1px solid #303030;
      }

      .chart {
        height: 300px;
      }
    }
  }
}
</style>
