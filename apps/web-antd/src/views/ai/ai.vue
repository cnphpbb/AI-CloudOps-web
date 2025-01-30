<template>
  <div class="ai-assistant-container">
    <a-float-button type="primary" @click="handleClick">
      <template #tooltip>
        <div>AI-CloudOps小助手</div>
      </template>
    </a-float-button>

    <a-drawer title="AI-CloudOps小助手" placement="right" :width="380" :visible="drawerVisible" @close="toggleChatDrawer"
      class="ai-chat-drawer">
      <div class="chat-container">
        <div class="chat-messages" ref="messagesContainer">
          <div v-for="(msg, index) in chatMessages" :key="index" :class="['message', msg.type]">
            <div class="avatar">
              <a-avatar :size="36" :src="msg.type === 'user' ? userAvatar : aiAvatar" />
            </div>
            <div class="content">
              <div class="name">{{ msg.type === 'user' ? '您' : 'AI助手' }}</div>
              <div class="text" v-html="renderMarkdown(msg.content)"></div>
              <div class="time">{{ msg.time }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <a-input-search v-model:value="globalInputMessage" placeholder="请输入您的问题..." enter-button="发送" size="large"
            @search="handleSearch" @keyup.enter="handleSearch" :disabled="sending" />
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { message } from 'ant-design-vue';
// @ts-ignore
import MarkdownIt from 'markdown-it';

// 初始化markdown解析器
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  html: false
});

// 状态管理
const drawerVisible = ref(false);
const globalInputMessage = ref('');
const sending = ref(false);
const messagesContainer = ref(null);
const userAvatar = 'https://avatar.vercel.sh/user.svg?text=U';
const aiAvatar = 'https://avatar.vercel.sh/ai.svg?text=AI';
let socket: WebSocket | null = null;
let currentResponse = '';

// 聊天消息
interface ChatMessage {
  content: string;
  type: 'user' | 'ai';
  time: string;
}

// WebSocket消息历史
interface ChatHistoryItem {
  role: string;
  content: string;
}

const chatMessages = reactive<ChatMessage[]>([
  {
    content: '您好！我是AI-CloudOps小助手，有什么可以帮助您的吗？',
    type: 'ai',
    time: formatTime(new Date())
  }
]);

// 聊天历史记录
const chatHistory = reactive<ChatHistoryItem[]>([
  {
    role: 'CloudOps小助手',
    content: '您好！我是AI-CloudOps小助手，有什么可以帮助您的吗？'
  }
]);


const handleSearch = () => {
  const msg = globalInputMessage.value.trim();
  if (!msg) return;
  globalInputMessage.value = ''; // 立即清空输入框
  sendMessage(msg);
};

// 渲染Markdown内容
const renderMarkdown = (content: string): string => {
  if (!content) return '';
  // 移除可能的undefined字符串
  content = content.replace(/undefined$/, '').trim();
  try {
    return md.render(content);
  } catch (e) {
    console.error('Markdown渲染错误:', e);
    return content;
  }
};

// 初始化WebSocket连接
const initWebSocket = () => {
  if (socket !== null) {
    return;
  }

  socket = new WebSocket('ws://localhost:8889/api/ai/chat/ws');

  socket.onopen = () => {
    console.log('WebSocket连接已建立');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      if (!data.done) {
        // 累积响应内容
        currentResponse += data.content;

        // 更新最后一条AI消息
        if (chatMessages[chatMessages.length - 1]?.type === 'ai') {
          chatMessages[chatMessages.length - 1]!.content = currentResponse;
        }

        // 滚动到底部
        nextTick(() => {
          scrollToBottom();
        });
      } else {
        // 消息完成，更新聊天历史
        sending.value = false;

        // 将完整回复添加到聊天历史
        chatHistory.push({
          role: 'CloudOps小助手',
          content: currentResponse
        });

        // 重置当前响应
        currentResponse = '';
      }
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket错误:', error);
    message.error('连接服务器失败，请稍后重试');
    sending.value = false;
  };

  socket.onclose = () => {
    console.log('WebSocket连接已关闭');
    socket = null;
  };
};

// 切换聊天抽屉显示状态
const toggleChatDrawer = () => {
  drawerVisible.value = !drawerVisible.value;
  if (drawerVisible.value) {
    initWebSocket();
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// 发送消息
const sendMessage = async (value: string) => {
  if (!value.trim()) {
    message.warning('请输入消息内容');
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    initWebSocket();
    message.warning('正在连接服务器，请稍后重试');
    return;
  }

  // 添加用户消息
  chatMessages.push({
    content: value,
    type: 'user',
    time: formatTime(new Date())
  });

  // 添加到聊天历史
  chatHistory.push({
    role: '用户',
    content: value
  });

  sending.value = true;

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  // 添加AI消息占位
  chatMessages.push({
    content: '',
    type: 'ai',
    time: formatTime(new Date())
  });

  // 重置当前响应
  currentResponse = '';

  // 准备发送的消息
  const messageToSend = {
    role: "CloudOps小助手",
    style: "专业",
    question: value,
    chatHistory: chatHistory.slice(0, -1) // 不包括当前问题
  };

  // 发送消息到WebSocket
  socket.send(JSON.stringify(messageToSend));
};

// 格式化时间
function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value as HTMLElement;
    container.scrollTop = container.scrollHeight;
  }
};

// 初始点击处理函数
const handleClick = () => {
  toggleChatDrawer();
};

onMounted(() => {
  // 初始化操作
});

onBeforeUnmount(() => {
  // 关闭WebSocket连接
  if (socket) {
    socket.close();
    socket = null;
  }
});
</script>

<style scoped>
.ai-assistant-container {
  position: relative;
}

.ai-chat-drawer :deep(.ant-drawer-body) {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.message .avatar {
  margin-right: 12px;
}

.message .content {
  background-color: #2dbc40;
  padding: 10px;
  border-radius: 8px;
  max-width: 80%;
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.ai .content {
  background-color: #3f8ddb;
}

.message .name {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 14px;
  color: #fff;
}

.message .text {
  word-break: break-word;
  color: #fff;
}

.message .text :deep(pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}

.message .text :deep(code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.message .text :deep(a) {
  color: #e6f7ff;
  text-decoration: underline;
}

.message .text :deep(ul),
.message .text :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.message .time {
  font-size: 12px;
  color: #eee;
  margin-top: 4px;
  text-align: right;
}

.chat-input {
  padding: 8px;
  height: 45px;
}
</style>
