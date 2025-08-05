<template>
  <div>
    <!-- 评论对话框 -->
    <a-modal 
      :open="commentDialog.visible" 
      title="添加评论" 
      :width="dialogWidth" 
      @ok="saveComment"
      @cancel="() => { commentDialog.visible = false }" 
      :destroy-on-close="true" 
      class="responsive-modal"
      :confirm-loading="loading"
    >
      <a-form :model="commentDialog.form" layout="vertical">
        <a-form-item label="评论内容" name="content" :rules="[{ required: true, message: '请输入评论内容' }]">
          <a-textarea v-model:value="commentDialog.form.content" :rows="4" placeholder="请输入评论内容" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="commentDialog.form.is_system">系统评论</a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 评论查看对话框 -->
    <a-modal 
      :open="commentsViewDialog.visible" 
      title="工单评论" 
      :width="previewDialogWidth" 
      :footer="null"
      @cancel="() => { commentsViewDialog.visible = false }" 
      class="comments-dialog responsive-modal"
    >
      <div class="comments-content">
        <div v-if="commentsList.length === 0" class="empty-comments">
          <a-empty description="暂无评论" />
        </div>
        <div v-else class="comments-list">
          <div v-for="comment in commentsList" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <div class="commenter-info">
                <a-avatar 
                  size="small" 
                  :style="{ backgroundColor: getAvatarColor(comment.operator_name || '') }"
                >
                  {{ getInitials(comment.operator_name) }}
                </a-avatar>
                <span class="commenter-name">{{ comment.operator_name }}</span>
                <a-tag v-if="comment.is_system === 1" color="orange" size="small">系统</a-tag>
              </div>
              <span class="comment-time">{{ formatFullDateTime(comment.created_at) }}</span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
            <div v-if="comment.children && comment.children.length > 0" class="comment-replies">
              <div v-for="reply in comment.children" :key="reply.id" class="reply-item">
                <div class="reply-header">
                  <div class="replier-info">
                    <a-avatar 
                      size="small" 
                      :style="{ backgroundColor: getAvatarColor(reply.operator_name || '') }"
                    >
                      {{ getInitials(reply.operator_name) }}
                    </a-avatar>
                    <span class="replier-name">{{ reply.operator_name }}</span>
                  </div>
                  <span class="reply-time">{{ formatFullDateTime(reply.created_at) }}</span>
                </div>
                <div class="reply-content">{{ reply.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineEmits, defineExpose } from 'vue'
import { message } from 'ant-design-vue'
import {
  type WorkorderInstanceCommentItem,
  type CreateWorkorderInstanceCommentReq,
  type GetInstanceCommentsTreeReq,
  createWorkorderInstanceComment,
  getInstanceCommentsTree
} from '#/api/core/workorder_instance_comment'

// 定义emits
const emit = defineEmits<{
  commentAdded: []
}>()

// 状态数据
const loading = ref(false)
const commentsList = ref<WorkorderInstanceCommentItem[]>([])

// 评论对话框
const commentDialog = reactive({
  visible: false,
  form: {
    instance_id: 0,
    content: '',
    is_system: 0
  } as CreateWorkorderInstanceCommentReq
})

// 评论查看对话框
const commentsViewDialog = reactive({
  visible: false,
  instanceId: 0
})

// 响应式对话框宽度
const dialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth
    if (width < 768) return '95%'
    if (width < 1024) return '80%'
    return '600px'
  }
  return '600px'
})

const previewDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth
    if (width < 768) return '95%'
    if (width < 1024) return '90%'
    return '80%'
  }
  return '80%'
})

// 工具方法
const formatFullDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name: string | undefined) => {
  if (!name) return ''
  return name
    .split('')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const getAvatarColor = (name: string | undefined) => {
  if (!name) return '#1890ff'

  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// 主要方法
const showCommentDialog = (instanceId: number) => {
  commentDialog.form = {
    instance_id: instanceId,
    content: '',
    is_system: 0
  }
  commentDialog.visible = true
}

const saveComment = async () => {
  try {
    if (!commentDialog.form.content.trim()) {
      message.error('请输入评论内容')
      return
    }

    loading.value = true
    await createWorkorderInstanceComment(commentDialog.form)
    message.success('评论添加成功')
    commentDialog.visible = false
    emit('commentAdded')
  } catch (error: any) {
    message.error(`添加评论失败: ${error.message || '未知错误'}`)
    console.error('Failed to create comment:', error)
  } finally {
    loading.value = false
  }
}

const showCommentsView = async (instanceId: number) => {
  commentsViewDialog.instanceId = instanceId
  commentsViewDialog.visible = true

  try {
    const params: GetInstanceCommentsTreeReq = {
      id: instanceId
    }

    const res = await getInstanceCommentsTree(params)
    if (res) {
      commentsList.value = res
    } else {
      commentsList.value = []
    }
  } catch (error: any) {
    console.error('Failed to load comments:', error)
    message.error(`加载评论失败: ${error.message || '未知错误'}`)
    commentsList.value = []
  }
}

// 导出方法供父组件调用
defineExpose({
  showCommentDialog,
  showCommentsView
})
</script>

<style scoped>
/* 评论样式 */
.comments-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 4px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  position: relative;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  padding: 20px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border-left: 4px solid #1890ff;
}

.comment-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.commenter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.commenter-info .ant-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.commenter-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.comment-time {
  font-size: 13px;
  color: #8c8c8c;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 8px;
  white-space: nowrap;
}

.comment-content {
  line-height: 1.7;
  color: #2c3e50;
  font-size: 15px;
  padding: 16px;
  background: #f8fafb;
  border-radius: 8px;
  border: 1px solid #e8f0fe;
  margin-bottom: 16px;
  position: relative;
}

.comment-content::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #1890ff, #40a9ff);
  border-radius: 2px;
}

.comment-replies {
  margin-left: 24px;
  position: relative;
  padding-left: 24px;
}

.comment-replies::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #e8f4f8, #d9ecf5);
  border-radius: 1px;
}

.reply-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #f0f8ff;
  border-radius: 10px;
  border: 1px solid #e1f3ff;
  position: relative;
  transition: all 0.2s ease;
}

.reply-item:hover {
  background: #e6f4ff;
  border-color: #bae7ff;
}

.reply-item::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 20px;
  width: 20px;
  height: 2px;
  background: #d9ecf5;
  border-radius: 1px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.replier-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.replier-info .ant-avatar {
  border: 1px solid #e1f3ff;
}

.replier-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.reply-time {
  font-size: 12px;
  color: #8c8c8c;
  background: #fff;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid #e8f4f8;
}

.reply-content {
  line-height: 1.6;
  color: #495057;
  font-size: 14px;
  padding: 12px;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #e8f4f8;
}

.empty-comments {
  text-align: center;
  padding: 60px 0;
  background: #fafbfc;
  border-radius: 12px;
  border: 2px dashed #e1e8ed;
}

.empty-comments :deep(.ant-empty-description) {
  color: #8c8c8c;
  font-size: 16px;
}

/* 评论对话框增强 */
.responsive-modal :deep(.ant-modal) {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

.responsive-modal :deep(.ant-modal-header) {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  border-radius: 8px 8px 0 0;
}

.responsive-modal :deep(.ant-modal-title) {
  color: white;
  font-weight: 600;
}

.responsive-modal :deep(.ant-modal-close) {
  color: white;
}

.responsive-modal :deep(.ant-modal-close:hover) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.responsive-modal :deep(.ant-modal-body) {
  padding: 24px;
  background: #fafbfc;
}

.comments-dialog :deep(.ant-modal-body) {
  background: #f8fafb;
}

/* 系统评论标识 */
.comment-item:has(.ant-tag[color="orange"]) {
  border-left-color: #faad14;
  background: linear-gradient(135deg, #fff7e6 0%, #ffffff 100%);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .comments-content {
    padding: 8px;
  }
  
  .comment-item {
    padding: 16px;
    margin-bottom: 16px;
  }

  .comment-header,
  .reply-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comment-content {
    padding: 12px;
    font-size: 14px;
  }

  .comment-replies {
    margin-left: 16px;
    padding-left: 16px;
  }

  .reply-item {
    padding: 12px;
    margin-bottom: 12px;
  }

  .reply-item::before {
    left: -18px;
    width: 14px;
  }

  .commenter-name {
    font-size: 14px;
  }

  .comment-time {
    font-size: 12px;
    padding: 2px 6px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .comment-item {
    padding: 12px;
    border-radius: 8px;
  }

  .comment-content {
    padding: 10px;
    font-size: 13px;
  }

  .comment-replies {
    margin-left: 8px;
    padding-left: 12px;
  }

  .reply-item::before {
    display: none;
  }

  .empty-comments {
    padding: 40px 16px;
  }
}

/* 滚动条样式 */
.comments-content::-webkit-scrollbar {
  width: 6px;
}

.comments-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.comments-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.comments-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>