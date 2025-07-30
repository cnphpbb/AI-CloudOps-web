<template>
  <div class="form-instance-container">
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateInstance" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          创建新工单
        </a-button>
        <a-input-search v-model:value="searchQuery" allow-clear placeholder="搜索工单..." style="width: 250px"
          @search="handleSearch" />
        <a-select v-model:value="statusFilter" placeholder="状态" style="width: 120px" @change="handleStatusChange">
          <a-select-option :value="null">全部</a-select-option>
          <a-select-option :value="0">草稿</a-select-option>
          <a-select-option :value="1">处理中</a-select-option>
          <a-select-option :value="2">已完成</a-select-option>
          <a-select-option :value="3">已取消</a-select-option>
          <a-select-option :value="4">已拒绝</a-select-option>
          <a-select-option :value="5">待处理</a-select-option>
          <a-select-option :value="6">已超时</a-select-option>
        </a-select>
        <a-range-picker v-model:value="dateRange" :allow-clear="true" :placeholder="['开始日期', '结束日期']"
          style="width: 240px" @change="handleDateRangeChange" />
        <a-button @click="fetchMyInstances('all')">我的工单</a-button>
        <a-button @click="fetchOverdueInstances">超时工单</a-button>
      </div>
    </div>

    <div class="stats-row">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic :value="statistics.total_count" :value-style="{ color: '#3f8600' }" title="总工单数">
              <template #prefix>
                <FileOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic :value="statistics.processing_count" :value-style="{ color: '#1890ff' }" title="处理中">
              <template #prefix>
                <ClockCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic :value="statistics.completed_count" :value-style="{ color: '#52c41a' }" title="已完成">
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic :value="statistics.rejected_count" :value-style="{ color: '#f5222d' }" title="已拒绝">
              <template #prefix>
                <CloseCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="table-container">
      <a-card>
        <a-table :columns="columns" :data-source="instances" :loading="loading" :pagination="false" bordered
          row-key="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <div class="form-name-cell">
                <div :class="getStatusClass(record.status)" class="form-badge"></div>
                <div>
                  <div class="form-name-text">{{ record.title }}</div>
                  <div class="instance-id">#{{ record.id }}</div>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
            </template>

            <template v-if="column.key === 'priority'">
              <a-tag :color="getPriorityColor(record.priority)">{{ getPriorityText(record.priority) }}</a-tag>
            </template>

            <template v-if="column.key === 'creator'">
              <div class="creator-info">
                <a-avatar :style="{ backgroundColor: getAvatarColor(record.creator_name) }" size="small">{{
                  getInitials(record.creator_name) }}</a-avatar>
                <span class="creator-name">{{ record.creator_name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'assignee'">
              <div v-if="record.assignee_name" class="creator-info">
                <a-avatar :style="{ backgroundColor: getAvatarColor(record.assignee_name) }" size="small">{{
                  getInitials(record.assignee_name) }}</a-avatar>
                <span class="creator-name">{{ record.assignee_name }}</span>
              </div>
              <span v-else>-</span>
            </template>

            <template v-if="column.key === 'created_at'">
              <div class="date-info">
                <span class="date">{{ formatDate(record.created_at) }}</span>
                <span class="time">{{ formatTime(record.created_at) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button size="small" type="primary" @click="handleViewInstance(record)">查看</a-button>
                <a-button :disabled="record.status !== 0" size="small" type="default"
                  @click="handleEditInstance(record)">编辑</a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleCommand(e.key, record)">
                      <a-menu-item v-if="record.status === 1" key="approve">批准</a-menu-item>
                      <a-menu-item v-if="record.status === 1" key="reject">拒绝</a-menu-item>
                      <a-menu-item v-if="record.status === 1" key="transfer">转交</a-menu-item>
                      <a-menu-item v-if="[0, 1, 5].includes(record.status)" key="cancel">取消</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger>删除</a-menu-item>
                    </a-menu>
                  </template>
                  <a-button size="small">更多
                    <DownOutlined />
                  </a-button>
                </a-dropdown>
              </div>
            </template>
          </template>
        </a-table>

        <div class="pagination-container">
          <a-pagination v-model:current="currentPage" :page-size="pageSize"
            :page-size-options="['10', '20', '50', '100']" :show-size-changer="true"
            :show-total="(total: number) => `共 ${total} 条`" :total="totalItems" @change="handleCurrentChange"
            @show-size-change="handleSizeChange" />
        </div>
      </a-card>
    </div>

    <!-- 工单详情对话框 -->
    <a-modal v-model:visible="detailDialog.visible" :footer="null" class="detail-dialog" title="工单详情" width="70%">
      <div v-if="detailDialog.instance" class="instance-details">
        <div class="detail-header">
          <h2>{{ detailDialog.instance.title }}</h2>
          <a-tag :color="getStatusColor(detailDialog.instance.status)">{{ getStatusText(detailDialog.instance.status)
          }}</a-tag>
          <a-tag :color="getPriorityColor(detailDialog.instance.priority)">{{
            getPriorityText(detailDialog.instance.priority) }}</a-tag>
          <a-tag v-if="detailDialog.instance.due_date && new Date(detailDialog.instance.due_date) < new Date()"
            color="red">已逾期</a-tag>
          <!-- 添加评论按钮 -->
          <a-button type="primary" ghost @click="openCommentsDialog" class="comments-btn">
            <MessageOutlined />
            评论 ({{ instanceComments.length }})
          </a-button>
        </div>

        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="工单ID">{{ detailDialog.instance.id }}</a-descriptions-item>
          <a-descriptions-item label="流程ID">{{ detailDialog.instance.process_id }}</a-descriptions-item>
          <a-descriptions-item label="当前节点">{{ detailDialog.instance.current_step }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.instance.creator_name }}</a-descriptions-item>
          <a-descriptions-item label="提交时间">{{ formatFullDateTime(detailDialog.instance.created_at || '')
          }}</a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.instance.assignee_name" label="处理人">{{
            detailDialog.instance.assignee_name
          }}</a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.instance.completed_at" label="完成时间">{{
            formatFullDateTime(detailDialog.instance.completed_at || '') }}</a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.instance.due_date" label="截止时间">{{
            formatFullDateTime(detailDialog.instance.due_date || '') }}</a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.instance.tags?.length" label="标签">
            <a-tag v-for="tag in detailDialog.instance.tags" :key="tag" color="blue">{{ tag }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item v-if="detailDialog.instance.description" :span="2" label="描述">{{
            detailDialog.instance.description }}</a-descriptions-item>
        </a-descriptions>

        <div class="form-data-preview">
          <h3>表单数据</h3>
          <a-collapse>
            <a-collapse-panel key="1" header="表单内容">
              <a-form layout="vertical">
                <template v-if="displayFormData && Object.keys(displayFormData).length > 0">
                  <a-form-item v-for="(value, field) in displayFormData" :key="field" :label="getFieldLabel(field)">
                    <a-input v-if="!Array.isArray(value)" v-model:value="displayFormData[field]" :disabled="true" />
                    <span v-else>{{ value.join(', ') }}</span>
                  </a-form-item>
                </template>
                <template v-else-if="formFieldDefinitions && formFieldDefinitions.length > 0">
                  <a-form-item v-for="field in formFieldDefinitions" :key="field.id" :label="field.label">
                    <a-input :disabled="true" :value="getFieldValue(field)" />
                  </a-form-item>
                </template>
                <a-alert v-else message="暂无表单数据" type="info" />
              </a-form>
            </a-collapse-panel>
          </a-collapse>
        </div>

        <div v-if="instanceFlows && instanceFlows.length > 0" class="flow-records">
          <h3>流转记录</h3>
          <a-timeline>
            <a-timeline-item v-for="flow in instanceFlows" :key="flow.id" :color="getFlowColor(flow.action)">
              <div class="flow-item">
                <div class="flow-header">
                  <span class="flow-node">{{ flow.step_name }}</span>
                  <span class="flow-action">{{ getFlowActionText(flow.action) }}</span>
                  <span class="flow-time">{{ formatFullDateTime(flow.created_at || '') }}</span>
                </div>
                <div class="flow-operator">操作人: {{ flow.operator_name }}</div>
                <div v-if="flow.comment" class="flow-comment">备注: {{ flow.comment }}</div>
                <div v-if="flow.duration" class="flow-duration">处理时长: {{ formatDuration(flow.duration) }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>

        <div v-if="detailDialog.instance.status === 1" class="action-area">
          <a-divider orientation="left">工单处理</a-divider>
          <a-textarea v-model:value="processingComment" :rows="3" placeholder="请输入处理意见..." />
          <div class="action-buttons mt-16">
            <a-button type="primary" @click="processInstance(detailDialog.instance, 'approve')">批准</a-button>
            <a-button danger @click="processInstance(detailDialog.instance, 'reject')">拒绝</a-button>
            <a-button @click="showTransferDialog">转交</a-button>
          </div>
        </div>

        <div class="detail-footer">
          <a-button @click="detailDialog.visible = false">关闭</a-button>
          <a-button v-if="detailDialog.instance.status === 0" type="primary"
            @click="handleEditInstance(detailDialog.instance)">编辑</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 评论对话框 -->
    <a-modal v-model:visible="commentsDialog.visible" title="工单评论" width="800px" :footer="null" class="comments-dialog">
      <div class="comments-container">
        <!-- 评论列表 -->
        <div class="comments-list-container">
          <div v-if="instanceComments.length > 0" class="comments-list">
            <div v-for="comment in instanceComments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <a-avatar :style="{ backgroundColor: getAvatarColor(comment.creator_name || `用户${comment.user_id}`) }">
                  {{ getInitials(comment.creator_name || `用户${comment.user_id}`) }}
                </a-avatar>
                <div class="comment-info">
                  <div class="comment-meta">
                    <span class="comment-author">{{ comment.creator_name || `用户${comment.user_id}` }}</span>
                    <a-tag v-if="comment.is_system" color="blue" size="small">系统</a-tag>
                    <span class="comment-time">{{ formatFullDateTime(comment.created_at || '') }}</span>
                  </div>
                </div>
                <div class="comment-actions">
                  <a-button type="text" size="small" @click="replyToComment(comment)">
                    <CommentOutlined />
                    回复
                  </a-button>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              
              <!-- 回复列表 -->
              <div v-if="comment.children && comment.children.length > 0" class="replies-container">
                <div v-for="reply in comment.children" :key="reply.id" class="reply-item">
                  <div class="reply-header">
                    <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(reply.creator_name || `用户${reply.user_id}`) }">
                      {{ getInitials(reply.creator_name || `用户${reply.user_id}`) }}
                    </a-avatar>
                    <div class="reply-info">
                      <span class="reply-author">{{ reply.creator_name || `用户${reply.user_id}` }}</span>
                      <span class="reply-time">{{ formatFullDateTime(reply.created_at || '') }}</span>
                    </div>
                  </div>
                  <div class="reply-content">{{ reply.content }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-comments">
            <a-empty description="暂无评论" />
          </div>
        </div>

        <!-- 添加评论 -->
        <div class="add-comment-section">
          <a-divider />
          <div class="comment-input-container">
            <div v-if="replyingTo" class="replying-indicator">
              <span>回复 @{{ replyingTo.creator_name || `用户${replyingTo.user_id}` }}:</span>
              <a-button type="text" size="small" @click="cancelReply">
                <CloseOutlined />
              </a-button>
            </div>
            <a-textarea 
              v-model:value="newComment" 
              :rows="4" 
              :placeholder="replyingTo ? `回复 ${replyingTo.creator_name || `用户${replyingTo.user_id}`}...` : '请输入评论...'"
              class="comment-textarea"
            />
            <div class="comment-actions-bar">
              <div class="comment-tips">
                <a-typography-text type="secondary">支持 Ctrl+Enter 快速发送</a-typography-text>
              </div>
              <div class="comment-buttons">
                <a-button v-if="replyingTo" @click="cancelReply">取消</a-button>
                <a-button 
                  type="primary" 
                  @click="submitComment" 
                  :loading="submittingComment"
                  :disabled="!newComment.trim()"
                >
                  {{ replyingTo ? '回复' : '发送' }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 创建/编辑工单对话框 -->
    <a-modal v-model:visible="instanceDialog.visible" :destroy-on-close="false"
      :title="instanceDialog.isEdit ? '编辑工单' : '创建工单'" width="760px" 
      :footer="null">
      <div v-if="!selectedProcess && !instanceDialog.isEdit" class="process-selection">
        <a-form-item label="标题" required>
          <a-input v-model:value="newInstance.title" placeholder="请输入工单标题" />
        </a-form-item>

        <a-form-item label="选择流程" required>
          <a-select v-model:value="newInstance.process_id" placeholder="请选择流程" style="width: 100%" show-search
            :filter-option="false" option-label-prop="children"
            :not-found-content="processSelectorLoading ? undefined : (processSearchKeyword ? '无搜索结果' : '无数据')"
            @search="handleProcessSearch" @dropdown-visible-change="handleProcessDropdownChange"
            @popup-scroll="handleProcessScroll" @change="handleSelectProcess" :loading="processSelectorLoading">
            <template #notFoundContent>
              <div v-if="processSelectorLoading" class="process-loading">
                <a-spin size="small" />
                <span style="margin-left: 8px;">加载中...</span>
              </div>
              <div v-else class="process-empty">
                {{ processSearchKeyword ? '无搜索结果' : '暂无流程数据' }}
              </div>
            </template>

            <!-- 流程选项 -->
            <a-select-option v-for="process in instanceDialogProcesses" :key="process.id" :value="process.id">
              <div class="process-option">
                <span class="process-name">{{ process.name }}</span>
                <span v-if="process.description" class="process-desc">{{ process.description }}</span>
              </div>
            </a-select-option>

            <!-- 加载更多指示器 -->
            <a-select-option v-if="processPagination.hasMore" :value="'__load_more__'" disabled
              class="load-more-option">
              <div class="load-more-content" @click.stop="loadMoreProcesses">
                <a-button type="link" size="small" :loading="processSelectorLoading"
                  style="padding: 0; height: auto; font-size: 12px;">
                  <template v-if="!processSelectorLoading">
                    <DownOutlined style="margin-right: 4px;" />
                    加载更多 ({{ processPagination.current }}/{{ totalProcessPages }})
                  </template>
                  <template v-else>
                    正在加载...
                  </template>
                </a-button>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="模板">
          <a-select v-model:value="newInstance.template_id" allow-clear placeholder="请选择模板(可选)" style="width: 100%">
            <a-select-option v-for="template in templates" :key="template.id" :value="template.id">{{ template.name
            }}</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="分类">
          <a-select v-model:value="newInstance.category_id" allow-clear placeholder="请选择分类(可选)" style="width: 100%" show-search
            :filter-option="false" option-label-prop="children"
            :not-found-content="categorySelectorLoading ? undefined : (categorySearchKeyword ? '无搜索结果' : '无数据')"
            @search="handleCategorySearch" @dropdown-visible-change="handleCategoryDropdownChange"
            @popup-scroll="handleCategoryScroll" :loading="categorySelectorLoading">
            <template #notFoundContent>
              <div v-if="categorySelectorLoading" class="category-loading">
                <a-spin size="small" />
                <span style="margin-left: 8px;">加载中...</span>
              </div>
              <div v-else class="category-empty">
                {{ categorySearchKeyword ? '无搜索结果' : '暂无分类数据' }}
              </div>
            </template>

            <!-- 分类选项 -->
            <a-select-option v-for="cat in instanceDialogCategories" :key="cat.id" :value="cat.id">
              <div class="category-option">
                <span class="category-name">{{ cat.name }}</span>
                <span v-if="cat.description" class="category-desc">{{ cat.description }}</span>
              </div>
            </a-select-option>

            <!-- 加载更多指示器 -->
            <a-select-option v-if="categoryPagination.hasMore" :value="'__load_more__'" disabled
              class="load-more-option">
              <div class="load-more-content" @click.stop="loadMoreCategories">
                <a-button type="link" size="small" :loading="categorySelectorLoading"
                  style="padding: 0; height: auto; font-size: 12px;">
                  <template v-if="!categorySelectorLoading">
                    <DownOutlined style="margin-right: 4px;" />
                    加载更多 ({{ categoryPagination.current }}/{{ totalCategoryPages }})
                  </template>
                  <template v-else>
                    正在加载...
                  </template>
                </a-button>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="优先级" required>
          <a-select v-model:value="newInstance.priority" placeholder="请选择优先级" style="width: 100%">
            <a-select-option :value="0">低</a-select-option>
            <a-select-option :value="1">普通</a-select-option>
            <a-select-option :value="2">高</a-select-option>
            <a-select-option :value="3">紧急</a-select-option>
            <a-select-option :value="4">严重</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="指定处理人">
          <a-select v-model:value="newInstance.assignee_id" allow-clear placeholder="请选择处理人(可选)" style="width: 100%">
            <a-select-option v-for="user in users" :key="user.id" :value="user.id">{{ user.real_name
            }}</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="截止日期">
          <a-date-picker v-model:value="dueDate" :show-time="{ format: 'HH:mm:ss' }" format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%" />
        </a-form-item>

        <a-form-item label="标签">
          <a-select v-model:value="newInstance.tags" :token-separators="[',']" mode="tags" placeholder="输入标签"
            style="width: 100%" />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea v-model:value="newInstance.description" :rows="3" placeholder="请输入工单描述..." />
        </a-form-item>

        <!-- 第一层表单的按钮 -->
        <div class="modal-footer">
          <a-button @click="cancelCreateInstance">取消</a-button>
          <a-button type="primary" @click="saveInstance" :disabled="!canSubmitBasicForm">创建工单</a-button>
        </div>
      </div>

      <!-- 当选择了流程时显示的表单 -->
      <div v-if="selectedProcess && !instanceDialog.isEdit" class="instance-form">
        <div class="process-info-section">
          <a-alert type="info" show-icon closable style="margin-bottom: 16px;">
            <template #message>
              <div class="selected-process-info">
                <span>已选择流程：<strong>{{ selectedProcess.name }}</strong></span>
                <a-button type="link" size="small" @click="backToProcessSelection" style="padding: 0; margin-left: 12px;">
                  重新选择流程
                </a-button>
              </div>
            </template>
          </a-alert>

          <!-- 显示已填写的基础信息 -->
          <div class="basic-info-summary">
            <a-descriptions size="small" :column="2" bordered style="margin-bottom: 16px;">
              <a-descriptions-item label="工单标题">{{ newInstance.title || '未填写' }}</a-descriptions-item>
              <a-descriptions-item label="优先级">{{ getPriorityText(newInstance.priority || 1) }}</a-descriptions-item>
              <a-descriptions-item v-if="newInstance.description" label="描述" :span="2">{{ newInstance.description }}</a-descriptions-item>
            </a-descriptions>
          </div>
        </div>

        <a-form layout="vertical">
          <!-- 流程相关表单字段 -->
          <template v-if="formFields.length > 0">
            <h4>请填写流程相关信息：</h4>
            <a-form-item v-for="field in formFields" :key="field.field" :label="field.label" :name="field.field"
              :rules="[{ required: field.required, message: `请输入${field.label}!` }]">
              <a-input v-if="field.type === 'text'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请输入${field.label}`" />
              <a-input-number v-else-if="field.type === 'number'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请输入${field.label}`" style="width: 100%" />
              <a-date-picker v-else-if="field.type === 'date'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请选择${field.label}`" style="width: 100%" />
              <a-select v-else-if="field.type === 'select'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请选择${field.label}`" style="width: 100%">
                <a-select-option v-for="option in field.options" :key="option" :value="option">{{ option
                }}</a-select-option>
              </a-select>
              <a-checkbox v-else-if="field.type === 'checkbox'" v-model:checked="formDataValues[field.field]">{{
                field.label }}</a-checkbox>
              <a-radio-group v-else-if="field.type === 'radio'" v-model:value="formDataValues[field.field]">
                <a-radio v-for="option in field.options" :key="option" :value="option">{{ option }}</a-radio>
              </a-radio-group>
              <a-textarea v-else-if="field.type === 'textarea'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请输入${field.label}`" :rows="3" />
            </a-form-item>
          </template>
          <a-alert v-else message="该流程暂无需要填写的字段，可以直接确定" type="info" />
        </a-form>

        <!-- 第二层表单的按钮 -->
        <div class="modal-footer">
          <a-button @click="cancelProcessForm">取消</a-button>
          <a-button type="primary" @click="confirmProcessForm">确定</a-button>
        </div>
      </div>

      <div v-if="instanceDialog.isEdit" class="instance-form">
        <div class="instance-form-header">
          <div class="instance-form-title">
            <h3>编辑: {{ instanceDialog.instance?.title }}</h3>
          </div>
        </div>

        <a-form layout="vertical">
          <template v-if="formFields.length > 0">
            <a-form-item v-for="field in formFields" :key="field.field" :label="field.label" :name="field.field"
              :rules="[{ required: field.required, message: `请输入${field.label}!` }]">
              <a-input v-if="field.type === 'text'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请输入${field.label}`" />
              <a-input-number v-else-if="field.type === 'number'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请输入${field.label}`" style="width: 100%" />
              <a-date-picker v-else-if="field.type === 'date'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请选择${field.label}`" style="width: 100%" />
              <a-select v-else-if="field.type === 'select'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请选择${field.label}`" style="width: 100%">
                <a-select-option v-for="option in field.options" :key="option" :value="option">{{ option
                }}</a-select-option>
              </a-select>
              <a-checkbox v-else-if="field.type === 'checkbox'" v-model:checked="formDataValues[field.field]">{{
                field.label }}</a-checkbox>
              <a-radio-group v-else-if="field.type === 'radio'" v-model:value="formDataValues[field.field]">
                <a-radio v-for="option in field.options" :key="option" :value="option">{{ option }}</a-radio>
              </a-radio-group>
              <a-textarea v-else-if="field.type === 'textarea'" v-model:value="formDataValues[field.field]"
                :placeholder="field.placeholder || `请输入${field.label}`" :rows="3" />
            </a-form-item>
          </template>
          <a-alert v-else message="未找到表单字段定义" type="warning" />
        </a-form>

        <!-- 编辑模式的按钮 -->
        <div class="modal-footer">
          <a-button @click="instanceDialog.visible = false">取消</a-button>
          <a-button type="primary" @click="saveInstance">保存</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 转交对话框 -->
    <a-modal v-model:visible="transferDialog.visible" cancel-text="取消" ok-text="转交" title="工单转交" @ok="confirmTransfer">
      <a-form layout="vertical">
        <a-form-item label="转交给" required>
          <a-select v-model:value="transferDialog.assigneeId" placeholder="请选择处理人">
            <a-select-option v-for="user in users" :key="user.id" :value="user.id">{{ user.real_name
            }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="转交说明">
          <a-textarea v-model:value="transferDialog.comment" :rows="3" placeholder="请输入转交说明..." />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal v-model:visible="deleteDialog.visible" cancel-text="取消" ok-text="删除" ok-type="danger" title="删除工单"
      @ok="confirmDelete">
      <p>确认要删除此工单吗？此操作不可恢复。</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch, computed } from 'vue';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DownOutlined,
  FileOutlined,
  MessageOutlined,
  PlusOutlined,
  CommentOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getUserList } from '#/api/core/user';
import { listCategory } from '#/api/core/workorder_category';
import {
  commentInstance,
  createInstance,
  type CreateInstanceReq,
  deleteInstance,
  detailInstance,
  getInstanceComments,
  getInstanceFlows,
  getMyInstances,
  getProcessDefinition,
  type Instance,
  type InstanceComment,
  type InstanceFlow,
  InstanceStatus,
  listInstance,
  type ListInstanceReq,
  type MyInstanceReq,
  Priority,
  processInstanceFlow,
  transferInstance,
  type TransferInstanceReq,
  updateInstance,
  type UpdateInstanceReq,
  type InstanceActionReq,
  type InstanceCommentReq,
} from '#/api/core/workorder_instance';
import { listProcess } from '#/api/core/workorder_process';

// 定义类型
interface Process {
  id: number;
  name: string;
  description?: string;
  version: number;
}

interface Template {
  id: number;
  name: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  real_name?: string;
}

interface Field {
  field: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface WorkOrderStatistics {
  total_count: number;
  completed_count: number;
  processing_count: number;
  canceled_count: number;
  rejected_count: number;
}

// 状态数据
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<number | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
const processingComment = ref('');
const newComment = ref('');
const dueDate = ref<dayjs.Dayjs | null>(null);
const submittingComment = ref(false);

// 数据源
const instances = ref<Instance[]>([]);
const users = ref<User[]>([]);
const templates = ref<Template[]>([]);

// 模态框中的分页数据
const instanceDialogProcesses = ref<Process[]>([]);
const instanceDialogCategories = ref<Category[]>([]);
const processSelectorLoading = ref(false);
const categorySelectorLoading = ref(false);
const processSearchKeyword = ref('');
const categorySearchKeyword = ref('');
let processSearchTimeout: any = null;
let categorySearchTimeout: any = null;

// 流程分页状态
const processPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 分类分页状态
const categoryPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

const instanceFlows = ref<InstanceFlow[]>([]);
const instanceComments = ref<InstanceComment[]>([]);
const statistics = ref<WorkOrderStatistics>({
  canceled_count: 0,
  completed_count: 0,
  processing_count: 0,
  rejected_count: 0,
  total_count: 0,
});

// 表单字段和数据
const formFields = ref<Field[]>([]);
const formDataValues = reactive<Record<string, any>>({});
const displayFormData = ref<null | Record<string, any>>(null);
const formFieldDefinitions = ref<any[]>([]);

// 对话框状态
const detailDialog = reactive({
  instance: null as Instance | null,
  visible: false,
});

const instanceDialog = reactive({
  instance: null as Instance | null,
  isEdit: false,
  visible: false,
});

const transferDialog = reactive({
  assigneeId: null as null | number,
  comment: '',
  instanceId: 0,
  visible: false,
});

const deleteDialog = reactive({
  instanceId: 0,
  visible: false,
});

// 评论对话框状态
const commentsDialog = reactive({
  visible: false,
});

// 回复状态
const replyingTo = ref<InstanceComment | null>(null);

const newInstance = reactive<CreateInstanceReq>({
  priority: Priority.Normal,
  process_id: undefined,
  tags: [],
  title: '',
});

const selectedProcess = ref<null | Process>(null);

const columns = [
  {
    dataIndex: 'title',
    key: 'title',
    title: '工单标题',
    width: 250,
  },
  {
    align: 'center',
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 100,
  },
  {
    align: 'center',
    dataIndex: 'priority',
    key: 'priority',
    title: '优先级',
    width: 100,
  },
  {
    dataIndex: 'creator_name',
    key: 'creator',
    title: '创建人',
    width: 120,
  },
  {
    dataIndex: 'assignee_name',
    key: 'assignee',
    title: '处理人',
    width: 120,
  },
  {
    dataIndex: 'created_at',
    key: 'created_at',
    title: '创建时间',
    width: 180,
  },
  {
    align: 'center',
    key: 'action',
    title: '操作',
    width: 200,
  },
];

watch(
  [currentPage, pageSize, searchQuery, statusFilter, dateRange],
  () => {
    fetchInstances();
  },
  { deep: true },
);

// 计算总页数
const totalProcessPages = computed(() => {
  return Math.ceil(processPagination.total / processPagination.pageSize);
});

const totalCategoryPages = computed(() => {
  return Math.ceil(categoryPagination.total / categoryPagination.pageSize);
});

const fetchInstances = async () => {
  try {
    loading.value = true;
    const params: ListInstanceReq = {
      page: currentPage.value,
      size: pageSize.value,
    };

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    if (statusFilter.value !== null) {
      params.status = statusFilter.value;
    }

    if (dateRange.value) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD');
      params.end_date = dateRange.value[1].format('YYYY-MM-DD');
    }

    const response = await listInstance(params);

    if (response) {
      instances.value = response.items || [];
      totalItems.value = response.total || 0;
    } else {
      instances.value = [];
      totalItems.value = 0;
    }
  } catch (error) {
    message.error('获取工单列表失败');
    console.error('Failed to fetch instances:', error);
    instances.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const fetchMyInstances = async (type: 'all' | 'assigned' | 'created' = 'all') => {
  try {
    loading.value = true;
    const params: MyInstanceReq = {
      page: currentPage.value,
      size: pageSize.value,
      type,
    };

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    if (statusFilter.value !== null) {
      params.status = statusFilter.value;
    }

    if (dateRange.value) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD');
      params.end_date = dateRange.value[1].format('YYYY-MM-DD');
    }

    const response = await getMyInstances(params);

    if (response && typeof response === 'object' && 'items' in response) {
      instances.value = response.items || [];
      totalItems.value = response.total || 0;
    } else if (Array.isArray(response)) {
      instances.value = response;
      totalItems.value = response.length;
    } else {
      instances.value = [];
      totalItems.value = 0;
    }
  } catch (error) {
    message.error('获取我的工单失败');
    console.error('Failed to fetch my instances:', error);
    instances.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const fetchOverdueInstances = async () => {
  try {
    loading.value = true;
    const params: ListInstanceReq = {
      page: currentPage.value,
      size: pageSize.value,
      overdue: true,
    };

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    if (statusFilter.value !== null) {
      params.status = statusFilter.value;
    }

    if (dateRange.value) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD');
      params.end_date = dateRange.value[1].format('YYYY-MM-DD');
    }

    const response = await listInstance(params);

    if (response && typeof response === 'object' && 'items' in response) {
      instances.value = response.items || [];
      totalItems.value = response.total || 0;
    } else if (Array.isArray(response)) {
      instances.value = response;
      totalItems.value = response.length;
    } else {
      instances.value = [];
      totalItems.value = 0;
    }
  } catch (error) {
    message.error('获取超时工单失败');
    console.error('Failed to fetch overdue instances:', error);
    instances.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const fetchInstanceDetail = async (id: number) => {
  try {
    const response = await detailInstance(id);
    if (!response) {
      message.error('获取工单详情失败: 无响应数据');
      return;
    }

    detailDialog.instance = response;

    let parsedFormData: any = null;

    if (typeof response.form_data === 'string') {
      try {
        parsedFormData = JSON.parse(response.form_data);
      } catch (error) {
        parsedFormData = {};
        console.error('解析表单数据失败:', error);
      }
    } else if (response.form_data && typeof response.form_data === 'object') {
      parsedFormData = response.form_data;
    }

    if (parsedFormData) {
      if (parsedFormData.fields && Array.isArray(parsedFormData.fields)) {
        formFieldDefinitions.value = parsedFormData.fields;

        if (parsedFormData.data) {
          displayFormData.value = parsedFormData.data;
        } else {
          const defaultData: Record<string, any> = {};
          parsedFormData.fields.forEach((field: any) => {
            defaultData[field.name] = field.default_value || '';
          });
          displayFormData.value = defaultData;
        }
      } else {
        displayFormData.value = parsedFormData;
        formFieldDefinitions.value = [];
      }
    } else {
      displayFormData.value = {};
      formFieldDefinitions.value = [];
    }

    await Promise.all([fetchInstanceFlows(id), fetchInstanceComments(id)]);
  } catch (error) {
    message.error('获取工单详情失败');
    console.error('Failed to fetch instance detail:', error);
  }
};

const fetchInstanceFlows = async (id: number) => {
  try {
    const response = await getInstanceFlows(id);
    instanceFlows.value = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Failed to fetch instance flows:', error);
    instanceFlows.value = [];
  }
};

const fetchInstanceComments = async (id: number) => {
  try {
    const response = await getInstanceComments(id);
    
    // 处理评论数据，后端已经返回了嵌套结构
    if (Array.isArray(response)) {
      // 递归处理评论数据，确保 creator_name 不为空
      const processComment = (comment: InstanceComment): InstanceComment => {
        let creatorName = comment.creator_name;
        if (!creatorName || creatorName.trim() === '') {
          creatorName = `用户${comment.user_id}`;
        }
        
        const processedComment = {
          ...comment,
          creator_name: creatorName,
          children: comment.children ? comment.children.map(processComment) : []
        };
        
        return processedComment;
      };
      
      instanceComments.value = response.map(processComment);
    } else {
      instanceComments.value = [];
    }
  } catch (error) {
    console.error('Failed to fetch instance comments:', error);
    instanceComments.value = [];
  }
};

const getFieldLabel = (fieldName: string) => {
  if (formFieldDefinitions.value && formFieldDefinitions.value.length > 0) {
    const field = formFieldDefinitions.value.find((f) => f.name === fieldName);
    return field ? field.label : fieldName;
  }
  return fieldName;
};

// 分页流程加载方法
const loadInstanceDialogProcesses = async (reset: boolean = false, search?: string): Promise<void> => {
  if (processSelectorLoading.value && !reset) {
    return;
  }

  processSelectorLoading.value = true;

  try {
    const params = {
      page: reset ? 1 : processPagination.current,
      size: processPagination.pageSize,
      search: search !== undefined ? search : processSearchKeyword.value || undefined,
      status: 2
    };

    const response = await listProcess(params);

    if (response) {
      if (reset) {
        instanceDialogProcesses.value = response.items || [];
        processPagination.current = 1;
      } else {
        const existingIds = new Set(instanceDialogProcesses.value.map(process => process.id));
        const newItems = (response.items || []).filter((process: any) => !existingIds.has(process.id));
        instanceDialogProcesses.value = [...instanceDialogProcesses.value, ...newItems];
      }

      processPagination.total = response.total || 0;
      processPagination.hasMore = (response.items || []).length === processPagination.pageSize &&
        instanceDialogProcesses.value.length < processPagination.total;
    }
  } catch (error: any) {
    console.error('加载流程列表失败:', error);
    if (reset) {
      message.error(error.message || '加载流程列表失败');
      instanceDialogProcesses.value = [];
      processPagination.current = 1;
      processPagination.total = 0;
      processPagination.hasMore = false;
    }
  } finally {
    processSelectorLoading.value = false;
  }
};

// 分页分类加载方法
const loadInstanceDialogCategories = async (reset: boolean = false, search?: string): Promise<void> => {
  if (categorySelectorLoading.value && !reset) {
    return;
  }

  categorySelectorLoading.value = true;

  try {
    const params = {
      page: reset ? 1 : categoryPagination.current,
      size: categoryPagination.pageSize,
      search: search !== undefined ? search : categorySearchKeyword.value || undefined
    };

    const response = await listCategory(params);

    if (response) {
      if (reset) {
        instanceDialogCategories.value = response.items || [];
        categoryPagination.current = 1;
      } else {
        const existingIds = new Set(instanceDialogCategories.value.map(cat => cat.id));
        const newItems = (response.items || []).filter((cat: any) => !existingIds.has(cat.id));
        instanceDialogCategories.value = [...instanceDialogCategories.value, ...newItems];
      }

      categoryPagination.total = response.total || 0;
      categoryPagination.hasMore = (response.items || []).length === categoryPagination.pageSize &&
        instanceDialogCategories.value.length < categoryPagination.total;
    }
  } catch (error: any) {
    console.error('加载分类列表失败:', error);
    if (reset) {
      message.error(error.message || '加载分类列表失败');
      instanceDialogCategories.value = [];
      categoryPagination.current = 1;
      categoryPagination.total = 0;
      categoryPagination.hasMore = false;
    }
  } finally {
    categorySelectorLoading.value = false;
  }
};

// 处理流程搜索
const handleProcessSearch = (value: string): void => {
  processSearchKeyword.value = value;

  if (processSearchTimeout) {
    clearTimeout(processSearchTimeout);
  }

  processSearchTimeout = setTimeout(() => {
    processPagination.current = 1;
    loadInstanceDialogProcesses(true, value);
  }, 300);
};

// 处理分类搜索
const handleCategorySearch = (value: string): void => {
  categorySearchKeyword.value = value;

  if (categorySearchTimeout) {
    clearTimeout(categorySearchTimeout);
  }

  categorySearchTimeout = setTimeout(() => {
    categoryPagination.current = 1;
    loadInstanceDialogCategories(true, value);
  }, 300);
};

// 处理下拉框显示/隐藏
const handleProcessDropdownChange = (open: boolean): void => {
  if (open) {
    if (instanceDialogProcesses.value.length === 0) {
      loadInstanceDialogProcesses(true);
    }
  }
};

const handleCategoryDropdownChange = (open: boolean): void => {
  if (open) {
    if (instanceDialogCategories.value.length === 0) {
      loadInstanceDialogCategories(true);
    }
  }
};

// 处理滚动加载更多
const handleProcessScroll = (e: Event): void => {
  const target = e.target as HTMLElement;
  if (target && target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
    if (processPagination.hasMore && !processSelectorLoading.value) {
      loadMoreProcesses();
    }
  }
};

const handleCategoryScroll = (e: Event): void => {
  const target = e.target as HTMLElement;
  if (target && target.scrollTop + target.offsetHeight >= target.scrollHeight - 10) {
    if (categoryPagination.hasMore && !categorySelectorLoading.value) {
      loadMoreCategories();
    }
  }
};

// 加载更多方法
const loadMoreProcesses = async (): Promise<void> => {
  if (!processPagination.hasMore || processSelectorLoading.value) {
    return;
  }

  processPagination.current += 1;
  await loadInstanceDialogProcesses(false);
};

const loadMoreCategories = async (): Promise<void> => {
  if (!categoryPagination.hasMore || categorySelectorLoading.value) {
    return;
  }

  categoryPagination.current += 1;
  await loadInstanceDialogCategories(false);
};

// 从流程步骤中提取表单字段
const extractFormFieldsFromSteps = (steps: any[]): Field[] => {
  const formFields: Field[] = [];
  
  // 遍历所有步骤，查找包含表单字段的步骤
  steps.forEach((step, index) => {
    if (step.props && typeof step.props === 'object') {
      // 检查props中是否有表单字段定义
      if (step.props.form_fields && Array.isArray(step.props.form_fields)) {
        step.props.form_fields.forEach((field: any) => {
          formFields.push({
            field: field.name || field.field || `field_${index}_${formFields.length}`,
            label: field.label || field.name || `字段${formFields.length + 1}`,
            type: field.type || 'text',
            required: field.required || false,
            placeholder: field.placeholder || `请输入${field.label || field.name}`,
            options: field.options || undefined,
          });
        });
      }
      // 检查props中的其他可能的表单字段结构
      else if (step.props.fields && Array.isArray(step.props.fields)) {
        step.props.fields.forEach((field: any) => {
          formFields.push({
            field: field.name || field.field || `field_${index}_${formFields.length}`,
            label: field.label || field.name || `字段${formFields.length + 1}`,
            type: field.type || 'text',
            required: field.required || false,
            placeholder: field.placeholder || `请输入${field.label || field.name}`,
            options: field.options || undefined,
          });
        });
      }
    }
    
    // 如果步骤的名称包含特定关键词，我们可以根据步骤类型生成默认表单字段
    if (step.type === 'start' && formFields.length === 0) {
      // 对于开始节点，如果没有找到表单字段，可以添加一些默认字段
      formFields.push({
        field: 'reason',
        label: '申请原因',
        type: 'textarea',
        required: true,
        placeholder: '请详细说明申请原因',
      });
    }
  });
  
  return formFields;
};

// 获取默认表单字段
const getDefaultFormFields = (): Field[] => {
  return [
    {
      field: 'title',
      label: '标题',
      placeholder: '请输入工单标题',
      required: true,
      type: 'text',
    },
    {
      field: 'description',
      label: '描述',
      placeholder: '请详细描述您的问题',
      required: true,
      type: 'textarea',
    },
  ];
};

const getFieldValue = (field: any) => {
  if (displayFormData.value && displayFormData.value[field.name] !== undefined) {
    return displayFormData.value[field.name];
  }
  return field.default_value || '';
};

const handleSelectProcess = async (processId: number) => {
  try {
    // 设置选中的流程
    selectedProcess.value = instanceDialogProcesses.value.find((p) => p.id === processId) || null;
    
    // 更新 newInstance 中的 process_id
    newInstance.process_id = processId;

    // 获取流程定义并生成表单字段
    try {
      const definition = await getProcessDefinition(processId);
      console.log('Process definition loaded:', definition);
      
      // 根据流程定义生成表单字段
      if (definition && definition.steps && Array.isArray(definition.steps)) {
        const formFieldsFromSteps = extractFormFieldsFromSteps(definition.steps);
        if (formFieldsFromSteps.length > 0) {
          formFields.value = formFieldsFromSteps;
        } else {
          formFields.value = getDefaultFormFields();
        }
      } else {
        formFields.value = getDefaultFormFields();
      }
    } catch (error) {
      console.error('Failed to fetch process definition:', error);
      formFields.value = getDefaultFormFields();
    }
  } catch (error) {
    message.error('选择流程失败');
    console.error('Failed to select process:', error);
  }
};

// 返回流程选择页面
const backToProcessSelection = () => {
  selectedProcess.value = null;
  newInstance.process_id = undefined;
  formFields.value = [];
  // 清空表单数据
  Object.keys(formDataValues).forEach((key) => delete formDataValues[key]);
};

// 取消创建工单（第一层）
const cancelCreateInstance = () => {
  instanceDialog.visible = false;
};

// 确认流程表单（第二层确定按钮）
const confirmProcessForm = () => {
  // 验证流程相关的必填字段
  const requiredFields = formFields.value.filter(field => field.required);
  for (const field of requiredFields) {
    const value = formDataValues[field.field];
    if (!value || (typeof value === 'string' && !value.trim())) {
      message.error(`请填写${field.label}`);
      return;
    }
  }
  
  // 验证通过，返回第一层表单，携带已填写的数据
  selectedProcess.value = null;
  // 注意：这里不清空 formDataValues，保持用户填写的流程数据
};

// 取消流程表单（第二层取消按钮）
const cancelProcessForm = () => {
  // 清空流程相关数据，返回第一层
  selectedProcess.value = null;
  newInstance.process_id = undefined;
  formFields.value = [];
  // 清空表单数据
  Object.keys(formDataValues).forEach((key) => delete formDataValues[key]);
};

// 计算属性：是否可以提交基础表单
const canSubmitBasicForm = computed(() => {
  return newInstance.title?.trim() && 
         newInstance.process_id && 
         (newInstance.priority !== undefined && newInstance.priority !== null);
});

const handleSizeChange = (_current: number, size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleStatusChange = () => {
  currentPage.value = 1;
};

const handleDateRangeChange = () => {
  currentPage.value = 1;
};

const handleCreateInstance = () => {
  instanceDialog.isEdit = false;
  instanceDialog.instance = null;
  selectedProcess.value = null;

  Object.assign(newInstance, {
    description: '',
    priority: Priority.Normal,
    process_id: undefined,
    tags: [],
    title: '',
  });

  Object.keys(formDataValues).forEach((key) => delete formDataValues[key]);

  dueDate.value = null;
  formFields.value = [];
  instanceDialog.visible = true;
  
  // 重置选择器状态
  resetDialogSelectors();
};

const handleEditInstance = (instance: Instance) => {
  instanceDialog.isEdit = true;
  instanceDialog.instance = JSON.parse(JSON.stringify(instance)) as Instance;

  let instanceFormData: Record<string, any> = {};
  let fieldDefinitions: any[] = [];

  if (typeof instance.form_data === 'string') {
    try {
      const parsed = JSON.parse(instance.form_data);
      if (parsed.fields && Array.isArray(parsed.fields)) {
        fieldDefinitions = parsed.fields;
        instanceFormData = parsed.data || {};
      } else {
        instanceFormData = parsed;
      }
    } catch (error) {
      instanceFormData = {};
      console.error('解析表单数据失败:', error);
    }
  } else if (instance.form_data && typeof instance.form_data === 'object') {
    const formData = instance.form_data as any;
    if (formData.fields && Array.isArray(formData.fields)) {
      fieldDefinitions = formData.fields;
      instanceFormData = formData.data || {};
    } else {
      instanceFormData = formData;
    }
  }

  if (fieldDefinitions.length > 0) {
    formFields.value = fieldDefinitions.map((field: any) => ({
      field: field.name,
      label: field.label,
      options: field.options
        ? field.options.map((opt: any) => (typeof opt === 'object' ? opt.label : opt))
        : undefined,
      placeholder: field.placeholder,
      required: field.required,
      type: field.type,
    }));
  } else {
    fetchProcessFormFields(instance.process_id);
  }

  Object.keys(formDataValues).forEach((key) => delete formDataValues[key]);

  Object.keys(instanceFormData).forEach((key) => {
    formDataValues[key] = instanceFormData[key];
  });

  instanceDialog.visible = true;
  detailDialog.visible = false;
};

const fetchProcessFormFields = async (processId: number) => {
  try {
    const definition = await getProcessDefinition(processId);
    
    if (definition && definition.steps && Array.isArray(definition.steps)) {
      // 从流程步骤中提取表单字段
      const formFieldsFromSteps = extractFormFieldsFromSteps(definition.steps);
      
      if (formFieldsFromSteps.length > 0) {
        formFields.value = formFieldsFromSteps;
      } else {
        // 如果没有找到表单字段，使用默认字段
        formFields.value = getDefaultFormFields();
      }
    } else {
      // 如果接口返回格式不符合预期，使用默认字段
      formFields.value = getDefaultFormFields();
    }
  } catch (error) {
    console.error('Failed to fetch process form fields:', error);
    formFields.value = getDefaultFormFields();
  }
};

const handleViewInstance = async (instance: Instance) => {
  await fetchInstanceDetail(instance.id);
  detailDialog.visible = true;
};

const handleCommand = async (command: string, instance: Instance) => {
  switch (command) {
    case 'approve':
      await processInstance(instance, 'approve');
      break;
    case 'cancel':
      await processInstance(instance, 'cancel');
      break;
    case 'delete':
      deleteDialog.instanceId = instance.id;
      deleteDialog.visible = true;
      break;
    case 'reject':
      await processInstance(instance, 'reject');
      break;
    case 'transfer':
      transferDialog.instanceId = instance.id;
      transferDialog.visible = true;
      break;
  }
};

const saveInstance = async () => {
  // 如果在编辑模式，直接保存
  if (instanceDialog.isEdit && instanceDialog.instance) {
    const updateData: UpdateInstanceReq = {
      id: instanceDialog.instance.id,
      priority: instanceDialog.instance.priority,
      title: instanceDialog.instance.title,
    };

    // 如果有表单数据，添加到更新数据中
    if (Object.keys(formDataValues).length > 0) {
      updateData.form_data = {
        fields: formFields.value,
        data: formDataValues
      };
    }

    try {
      await updateInstance(instanceDialog.instance.id, updateData);
      message.success('工单更新成功');
      instanceDialog.visible = false;
      fetchInstances();
    } catch (error) {
      message.error('保存工单失败');
      console.error('Failed to save instance:', error);
    }
    return;
  }

  // 创建模式的验证
  if (!newInstance.title?.trim()) {
    message.error('请输入工单标题');
    return;
  }

  if (!newInstance.process_id) {
    message.error('请选择流程');
    return;
  }

  if (newInstance.priority === undefined || newInstance.priority === null) {
    message.error('请选择优先级');
    return;
  }

  try {
    // 获取流程定义并生成表单字段
    let formFieldsToUse: Field[] = [];
    try {
      const definition = await getProcessDefinition(newInstance.process_id);
      if (definition && definition.steps && Array.isArray(definition.steps)) {
        formFieldsToUse = extractFormFieldsFromSteps(definition.steps);
      }
    } catch (error) {
      console.error('Failed to fetch process definition for form fields:', error);
    }

    // 如果没有找到表单字段，使用默认字段
    if (formFieldsToUse.length === 0) {
      formFieldsToUse = getDefaultFormFields();
    }

    // 检查是否有流程相关的必填字段需要填写
    const requiredProcessFields = formFieldsToUse.filter(field => field.required);
    
    if (requiredProcessFields.length > 0) {
      // 检查是否所有必填字段都已填写
      let hasUnfilledRequiredFields = false;
      for (const field of requiredProcessFields) {
        const value = formDataValues[field.field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          hasUnfilledRequiredFields = true;
          break;
        }
      }
      
      if (hasUnfilledRequiredFields) {
        message.warning('该流程有必填字段需要填写，请完成流程表单后再提交');
        return;
      }
    }

    const createData: CreateInstanceReq = {
      ...newInstance,
      process_id: newInstance.process_id,
    };

    if (dueDate.value) {
      createData.due_date = dueDate.value.toISOString();
    }

    // 添加表单数据
    createData.form_data = {
      fields: formFieldsToUse,
      data: formDataValues
    };

    await createInstance(createData);
    message.success('工单创建成功');
    instanceDialog.visible = false;
    fetchInstances();
  } catch (error) {
    message.error('保存工单失败');
    console.error('Failed to save instance:', error);
  }
};

const processInstance = async (instance: Instance, action: string) => {
  if (!processingComment.value && ['approve', 'reject'].includes(action)) {
    message.warning('请输入处理意见');
    return;
  }

  try {
    const flowData: InstanceActionReq = {
      action: action as any,
      comment: processingComment.value,
      instance_id: instance.id,
      step_id: instance.current_step,
    };

    await processInstanceFlow(instance.id, flowData);

    const actionText =
      {
        approve: '批准',
        cancel: '取消',
        reject: '拒绝',
        revoke: '撤回',
      }[action] || action;

    message.success(`工单 #${instance.id} 已${actionText}`);
    detailDialog.visible = false;
    processingComment.value = '';
    fetchInstances();
  } catch (error) {
    message.error('处理工单失败');
    console.error('Failed to process instance:', error);
  }
};

const showTransferDialog = () => {
  if (detailDialog.instance) {
    transferDialog.instanceId = detailDialog.instance.id;
    transferDialog.visible = true;
  }
};

const confirmTransfer = async () => {
  if (!transferDialog.assigneeId) {
    message.warning('请选择转交人');
    return;
  }

  if (!detailDialog.instance) {
    message.error('工单实例不存在');
    return;
  }

  try {
    const transferData: TransferInstanceReq = {
      instance_id: detailDialog.instance.id,
      assignee_id: transferDialog.assigneeId,
      comment: transferDialog.comment,
    };

    await transferInstance(transferDialog.instanceId, transferData);
    message.success('工单转交成功');
    transferDialog.visible = false;
    transferDialog.assigneeId = null;
    transferDialog.comment = '';

    if (detailDialog.visible && detailDialog.instance) {
      fetchInstanceDetail(detailDialog.instance.id);
    }
    fetchInstances();
  } catch (error) {
    message.error('工单转交失败');
    console.error('Failed to transfer instance:', error);
  }
};

// 打开评论对话框
const openCommentsDialog = () => {
  commentsDialog.visible = true;
};

// 回复评论
const replyToComment = (comment: InstanceComment) => {
  replyingTo.value = comment;
  newComment.value = '';
};

// 取消回复
const cancelReply = () => {
  replyingTo.value = null;
  newComment.value = '';
};

// 提交评论
const submitComment = async () => {
  if (!newComment.value.trim() || !detailDialog.instance) {
    message.warning('请输入评论内容');
    return;
  }

  try {
    submittingComment.value = true;
    
    const commentData: InstanceCommentReq = {
      content: newComment.value.trim(),
      instance_id: detailDialog.instance.id,
      parent_id: replyingTo.value?.id,
    };

    await commentInstance(detailDialog.instance.id, commentData);
    
    message.success(replyingTo.value ? '回复成功' : '评论成功');
    newComment.value = '';
    replyingTo.value = null;

    // 重新获取评论列表
    await fetchInstanceComments(detailDialog.instance.id);
  } catch (error) {
    message.error('提交失败');
    console.error('Failed to submit comment:', error);
  } finally {
    submittingComment.value = false;
  }
};

const confirmDelete = async () => {
  try {
    await deleteInstance(deleteDialog.instanceId);
    message.success(`工单 #${deleteDialog.instanceId} 已删除`);
    deleteDialog.visible = false;
    fetchInstances();
  } catch (error) {
    message.error('删除工单失败');
    console.error('Failed to delete instance:', error);
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD');
};

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('HH:mm');
};

const formatFullDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}小时${minutes % 60}分钟`;
  } else {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return `${days}天${hours}小时`;
  }
};

const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split('')
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getStatusClass = (status: number) => {
  switch (status) {
    case InstanceStatus.Cancelled:
      return 'status-cancelled';
    case InstanceStatus.Completed:
      return 'status-completed';
    case InstanceStatus.Draft:
      return 'status-draft';
    case InstanceStatus.Overdue:
      return 'status-overdue';
    case InstanceStatus.Pending:
      return 'status-pending';
    case InstanceStatus.Processing:
      return 'status-processing';
    case InstanceStatus.Rejected:
      return 'status-rejected';
    default:
      return '';
  }
};

const getStatusColor = (status: number) => {
  switch (status) {
    case InstanceStatus.Cancelled:
      return 'default';
    case InstanceStatus.Completed:
      return 'green';
    case InstanceStatus.Draft:
      return 'orange';
    case InstanceStatus.Overdue:
      return 'volcano';
    case InstanceStatus.Pending:
      return 'gold';
    case InstanceStatus.Processing:
      return 'blue';
    case InstanceStatus.Rejected:
      return 'red';
    default:
      return 'default';
  }
};

const getStatusText = (status: number) => {
  switch (status) {
    case InstanceStatus.Cancelled:
      return '已取消';
    case InstanceStatus.Completed:
      return '已完成';
    case InstanceStatus.Draft:
      return '草稿';
    case InstanceStatus.Overdue:
      return '已超时';
    case InstanceStatus.Pending:
      return '待处理';
    case InstanceStatus.Processing:
      return '处理中';
    case InstanceStatus.Rejected:
      return '已拒绝';
    default:
      return '未知';
  }
};

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case Priority.Critical:
      return 'volcano';
    case Priority.High:
      return 'orange';
    case Priority.Low:
      return 'green';
    case Priority.Normal:
      return 'blue';
    case Priority.Urgent:
      return 'red';
    default:
      return 'default';
  }
};

const getPriorityText = (priority: number) => {
  switch (priority) {
    case Priority.Critical:
      return '严重';
    case Priority.High:
      return '高';
    case Priority.Low:
      return '低';
    case Priority.Normal:
      return '普通';
    case Priority.Urgent:
      return '紧急';
    default:
      return '未知';
  }
};

const getFlowColor = (action: string) => {
  switch (action) {
    case 'approve':
      return 'green';
    case 'cancel':
      return 'orange';
    case 'reject':
      return 'red';
    case 'revoke':
      return 'purple';
    case 'transfer':
      return 'blue';
    default:
      return 'gray';
  }
};

const getFlowActionText = (action: string) => {
  switch (action) {
    case 'approve':
      return '批准';
    case 'cancel':
      return '取消';
    case 'reject':
      return '拒绝';
    case 'revoke':
      return '撤回';
    case 'transfer':
      return '转交';
    default:
      return action;
  }
};

const getAvatarColor = (name: string) => {
  const colors = [
    '#1890ff',
    '#52c41a',
    '#faad14',
    '#f5222d',
    '#722ed1',
    '#13c2c2',
    '#eb2f96',
    '#fa8c16',
  ];

  let hash = 0;
  if (!name) return colors[0];

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// 重置对话框选择器状态
const resetDialogSelectors = (): void => {
  // 重置流程选择器
  instanceDialogProcesses.value = [];
  processPagination.current = 1;
  processPagination.total = 0;
  processPagination.hasMore = false;
  processSearchKeyword.value = '';
  processSelectorLoading.value = false;

  // 重置分类选择器
  instanceDialogCategories.value = [];
  categoryPagination.current = 1;
  categoryPagination.total = 0;
  categoryPagination.hasMore = false;
  categorySearchKeyword.value = '';
  categorySelectorLoading.value = false;

  // 清除搜索定时器
  if (processSearchTimeout) {
    clearTimeout(processSearchTimeout);
    processSearchTimeout = null;
  }
  if (categorySearchTimeout) {
    clearTimeout(categorySearchTimeout);
    categorySearchTimeout = null;
  }
};

const initData = async () => {
  try {
    // 只加载用户列表和模板数据，流程和分类改为按需加载
    const usersResponse = await getUserList({
      page: currentPage.value,
      search: '',
      size: pageSize.value,
    });
    users.value = usersResponse.items || [];

    templates.value = [
      { description: '通用工单模板', id: 1, name: '通用模板' },
      { description: '紧急工单模板', id: 2, name: '紧急模板' },
    ];
  } catch (error) {
    message.error('初始化数据失败');
    console.error('数据初始化失败:', error);
  }
};

// 键盘快捷键处理
const handleKeyboardShortcuts = (e: KeyboardEvent) => {
  if (commentsDialog.visible && e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    submitComment();
  }
};

onMounted(() => {
  initData();
  fetchInstances();
  document.addEventListener('keydown', handleKeyboardShortcuts);
});

// 组件卸载时清理事件监听器
onMounted(() => {
  return () => {
    document.removeEventListener('keydown', handleKeyboardShortcuts);
  };
});
</script>

<style scoped>
.form-instance-container {
  padding: 24px;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-create {
  background: #1890ff;
  border: none;
}

.stats-row {
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.table-container {
  margin-bottom: 24px;
}

.form-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-draft {
  background-color: #faad14;
}

.status-processing {
  background-color: #1890ff;
}

.status-completed {
  background-color: #52c41a;
}

.status-rejected {
  background-color: #f5222d;
}

.status-cancelled {
  background-color: #d9d9d9;
}

.status-pending {
  background-color: #fadb14;
}

.status-overdue {
  background-color: #ff4d4f;
}

.form-name-text {
  font-weight: 500;
}

.instance-id {
  font-size: 12px;
  color: #8c8c8c;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator-name {
  font-size: 14px;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date {
  font-weight: 500;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #8c8c8c;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-dialog .instance-details {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.comments-btn {
  margin-left: auto;
}

.form-data-preview,
.flow-records {
  margin-top: 24px;
}

.form-data-preview h3,
.flow-records h3 {
  margin-bottom: 16px;
  color: #1f2937;
  font-size: 18px;
}

.flow-item {
  padding: 8px 0;
}

.flow-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.flow-node {
  font-weight: 500;
}

.flow-action {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.flow-time {
  color: #8c8c8c;
  font-size: 12px;
  margin-left: auto;
}

.flow-operator,
.flow-comment,
.flow-duration {
  font-size: 14px;
  margin-top: 4px;
}

.detail-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.process-selection {
  margin-bottom: 24px;
}

.instance-form-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24px;
}

.back-button {
  margin-right: 16px;
}

.instance-form-title {
  flex: 1;
}

.instance-form h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #1f2937;
}

.instance-form p {
  margin-bottom: 24px;
  color: #6b7280;
}

.action-area {
  margin-top: 24px;
  padding: 16px;
  border-radius: 4px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-8 {
  margin-top: 8px;
}

/* 评论对话框样式 */
.comments-dialog {
  .ant-modal-body {
    padding: 0;
  }
}

.comments-container {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.comments-list-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.comment-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.comment-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-info {
  flex: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
}

.comment-time {
  font-size: 12px;
  color: #6b7280;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-content {
  padding-left: 44px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.replies-container {
  margin-top: 16px;
  padding-left: 44px;
  border-left: 2px solid #e5e7eb;
}

.reply-item {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-author {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.reply-time {
  font-size: 11px;
  color: #6b7280;
}

.reply-content {
  padding-left: 32px;
  line-height: 1.5;
  color: #4b5563;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-comments {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.add-comment-section {
  background: white;
  border-top: 1px solid #e5e7eb;
}

.comment-input-container {
  padding: 20px;
}

.replying-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #0369a1;
}

.comment-textarea {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  transition: all 0.3s ease;
}

.comment-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.comment-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.comment-tips {
  color: #6b7280;
  font-size: 12px;
}

.comment-buttons {
  display: flex;
  gap: 8px;
}

/* 自定义模态框底部样式 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 24px;
}

/* 流程信息相关样式 */
.process-info-section {
  margin-bottom: 20px;
}

.selected-process-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-process-info span {
  flex: 1;
}

.basic-info-summary {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.basic-info-summary h4 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

/* 选择器样式 */
.category-loading,
.category-empty,
.process-loading,
.process-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  color: #8c8c8c;
  font-size: 14px;
}

.category-option,
.process-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name,
.process-name {
  font-weight: 500;
  color: #262626;
}

.category-desc,
.process-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.load-more-option {
  text-align: center;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
  background-color: #fafafa !important;
}

.load-more-option:hover {
  background-color: #f0f0f0 !important;
}

.load-more-content {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.load-more-content:hover {
  background-color: #e6f7ff;
  border-radius: 4px;
}

/* 选择器下拉列表样式优化 */
:deep(.ant-select-dropdown) {
  .load-more-option.ant-select-item-option-disabled {
    color: #1890ff !important;
    cursor: pointer !important;
    background-color: #fafafa !important;
  }

  .load-more-option.ant-select-item-option-disabled:hover {
    background-color: #f0f0f0 !important;
  }
}

@media (max-width: 768px) {
  .form-instance-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons {
    justify-content: flex-start;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .comments-container {
    height: 500px;
  }

  .comment-content,
  .reply-content {
    padding-left: 0;
  }

  .replies-container {
    padding-left: 20px;
  }

  .comment-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
