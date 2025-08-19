<template>
  <div>
    <a-card title="文件管理" :bordered="false">
      <a-upload :before-upload="beforeUpload" :show-upload-list="false">
        <a-button type="primary">上传文件</a-button>
      </a-upload>
      <a-button style="margin-left: 12px" @click="onDownload" :loading="downloading">打包下载</a-button>
      <a-card v-if="lastUpload" style="margin-top: 12px" title="最近上传结果">
        <pre style="white-space: pre-wrap">{{ pretty(lastUpload) }}</pre>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { assistantKnowledgeUploadApi, assistantKnowledgeDownloadApi } from '#/api';

const lastUpload = ref<any | null>(null);
const downloading = ref(false);

function pretty(v: any) { try { return JSON.stringify(v ?? {}, null, 2); } catch { return String(v ?? ''); } }

async function beforeUpload(file: File) {
  const res = await assistantKnowledgeUploadApi(file);
  lastUpload.value = res;
  message.success('上传成功');
  return false; // 阻止 a-upload 自己上传
}

async function onDownload() {
  downloading.value = true;
  try {
    const blob = await assistantKnowledgeDownloadApi();
    const url = window.URL.createObjectURL(blob as any);
    const a = document.createElement('a');
    a.href = url; a.download = 'knowledge.zip'; a.click();
    window.URL.revokeObjectURL(url);
  } finally { downloading.value = false; }
}
</script>
