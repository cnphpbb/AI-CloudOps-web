<template>
  <div class="instance-management-container">
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateInstance" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          创建工单
        </a-button>
        <div class="search-filters">
          <a-input-search 
            v-model:value="searchQuery" 
            placeholder="搜索工单标题或编号..." 
            class="search-input" 
            @search="handleSearch"
            allow-clear 
          />
          <a-select 
            v-model:value="statusFilter" 
            placeholder="状态" 
            class="status-filter" 
            @change="handleStatusChange"
          >
            <a-select-option :value="undefined">全部状态</a-select-option>
            <a-select-option :value="InstanceStatus.Draft">草稿</a-select-option>
            <a-select-option :value="InstanceStatus.Pending">待处理</a-select-option>
            <a-select-option :value="InstanceStatus.Processing">处理中</a-select-option>
            <a-select-option :value="InstanceStatus.Completed">已完成</a-select-option>
            <a-select-option :value="InstanceStatus.Rejected">已拒绝</a-select-option>
            <a-select-option :value="InstanceStatus.Cancelled">已取消</a-select-option>
          </a-select>
          <a-select 
            v-model:value="priorityFilter" 
            placeholder="优先级" 
            class="priority-filter" 
            @change="handlePriorityChange"
          >
            <a-select-option :value="undefined">全部优先级</a-select-option>
            <a-select-option :value="Priority.Low">低</a-select-option>
            <a-select-option :value="Priority.Normal">普通</a-select-option>
            <a-select-option :value="Priority.High">高</a-select-option>
          </a-select>
          <a-select 
            v-model:value="processFilter" 
            placeholder="流程" 
            class="process-filter" 
            @change="handleProcessChange"
          >
            <a-select-option :value="undefined">全部流程</a-select-option>
            <a-select-option v-for="process in processes" :key="process.id" :value="process.id">
              {{ process.name }}
            </a-select-option>
          </a-select>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic 
              title="总工单数" 
              :value="stats.total" 
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <FileTextOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic 
              title="待处理" 
              :value="stats.pending" 
              :value-style="{ color: '#faad14' }"
            >
              <template #prefix>
                <ClockCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic 
              title="处理中" 
              :value="stats.processing" 
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <LoadingOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic 
              title="已完成" 
              :value="stats.completed" 
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="table-container">
      <a-card>
        <a-table 
          :data-source="instanceList" 
          :columns="columns" 
          :pagination="paginationConfig" 
          :loading="loading"
          row-key="id" 
          bordered 
          :scroll="{ x: 1400 }" 
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <div class="instance-title-cell">
                <div class="priority-badge" :class="getPriorityClass(record.priority)"></div>
                <div class="title-content">
                  <div class="title-text">{{ record.title }}</div>
                  <div class="serial-number">{{ record.serial_number }}</div>
                </div>
              </div>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>

            <template v-if="column.key === 'priority'">
              <a-tag :color="getPriorityColor(record.priority)">
                {{ getPriorityText(record.priority) }}
              </a-tag>
            </template>

            <template v-if="column.key === 'operator'">
              <div class="operator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.operator_name || '') }">
                  {{ getInitials(record.operator_name) }}
                </a-avatar>
                <span class="operator-name">{{ record.operator_name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'assignee'">
              <div class="assignee-info" v-if="record.assignee_id">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(getAssigneeName(record.assignee_id)) }">
                  {{ getInitials(getAssigneeName(record.assignee_id)) }}
                </a-avatar>
                <span class="assignee-name">{{ getAssigneeName(record.assignee_id) }}</span>
              </div>
              <span v-else class="text-gray">未分配</span>
            </template>

            <template v-if="column.key === 'createdAt'">
              <div class="date-info">
                <span class="date">{{ formatDate(record.created_at) }}</span>
                <span class="time">{{ formatTime(record.created_at) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button type="primary" size="small" @click="handleViewInstance(record)">
                  查看
                </a-button>
                <a-button 
                  type="default" 
                  size="small" 
                  @click="handleEditInstance(record)" 
                  v-if="record.status === InstanceStatus.Draft"
                >
                  编辑
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleCommand(e.key, record)">
                      <a-menu-item key="comment">
                        <MessageOutlined /> 添加评论
                      </a-menu-item>
                      <a-menu-item key="timeline">
                        <HistoryOutlined /> 查看时间线
                      </a-menu-item>
                      <a-menu-item key="flow">
                        <PlayCircleOutlined /> 查看流转
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item 
                        key="submit" 
                        v-if="record.status === InstanceStatus.Draft"
                      >
                        提交工单
                      </a-menu-item>
                      <a-menu-item 
                        key="assign" 
                        v-if="[InstanceStatus.Pending, InstanceStatus.Processing].includes(record.status)"
                      >
                        分配处理人
                      </a-menu-item>
                      <a-menu-item 
                        key="approve" 
                        v-if="[InstanceStatus.Pending, InstanceStatus.Processing].includes(record.status)"
                      >
                        审批通过
                      </a-menu-item>
                      <a-menu-item 
                        key="reject" 
                        v-if="[InstanceStatus.Pending, InstanceStatus.Processing].includes(record.status)"
                      >
                        拒绝工单
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger v-if="record.status === InstanceStatus.Draft">
                        删除
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button size="small">
                    更多
                    <DownOutlined />
                  </a-button>
                </a-dropdown>
              </div>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 工单创建/编辑对话框 -->
    <a-modal 
      :open="instanceDialog.visible" 
      :title="instanceDialog.isEdit ? '编辑工单' : '创建工单'" 
      :width="formDialogWidth"
      @ok="saveInstance" 
      @cancel="() => { instanceDialog.visible = false }" 
      :destroy-on-close="true"
      class="responsive-modal instance-form-modal" 
      :confirm-loading="loading"
    >
      <a-form ref="formRef" :model="instanceDialog.form" :rules="formRules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="工单标题" name="title">
              <a-input v-model:value="instanceDialog.form.title" placeholder="请输入工单标题" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="优先级" name="priority">
              <a-select v-model:value="instanceDialog.form.priority" placeholder="请选择优先级">
                <a-select-option :value="Priority.Low">低</a-select-option>
                <a-select-option :value="Priority.Normal">普通</a-select-option>
                <a-select-option :value="Priority.High">高</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="关联流程" name="process_id">
              <a-select 
                v-model:value="instanceDialog.form.process_id" 
                placeholder="请选择流程" 
                style="width: 100%"
                show-search 
                :filter-option="false" 
                option-label-prop="children"
                :not-found-content="processSelectorLoading ? undefined : (processSearchKeyword ? '无搜索结果' : '无数据')"
                @search="handleProcessSearch" 
                @dropdown-visible-change="handleProcessDropdownChange"
                @popup-scroll="handleProcessScroll" 
                allow-clear 
                :loading="processSelectorLoading"
              >
                <template #notFoundContent>
                  <div v-if="processSelectorLoading" class="selector-loading">
                    <a-spin size="small" />
                    <span style="margin-left: 8px;">加载中...</span>
                  </div>
                  <div v-else class="selector-empty">
                    {{ processSearchKeyword ? '无搜索结果' : '暂无流程数据' }}
                  </div>
                </template>

                <a-select-option v-for="process in dialogProcesses" :key="process.id" :value="process.id">
                  <div class="process-option">
                    <span class="process-name">{{ process.name }}</span>
                    <span v-if="process.description" class="process-desc">{{ process.description }}</span>
                  </div>
                </a-select-option>

                <a-select-option 
                  v-if="processPagination.hasMore" 
                  :value="'__load_more_process__'" 
                  disabled
                  class="load-more-option"
                >
                  <div class="load-more-content" @click.stop="loadMoreProcesses">
                    <a-button 
                      type="link" 
                      size="small" 
                      :loading="processSelectorLoading"
                      style="padding: 0; height: auto; font-size: 12px;"
                    >
                      <template v-if="!processSelectorLoading">
                        加载更多 ({{ processPagination.current }}/{{ processTotalPages }})
                      </template>
                      <template v-else>
                        正在加载...
                      </template>
                    </a-button>
                  </div>
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="指定处理人" name="assignee_id">
              <a-select 
                v-model:value="instanceDialog.form.assignee_id" 
                placeholder="请选择处理人" 
                style="width: 100%"
                show-search 
                :filter-option="false" 
                option-label-prop="children"
                :not-found-content="userSelectorLoading ? undefined : (userSearchKeyword ? '无搜索结果' : '无数据')"
                @search="handleUserSearch" 
                @dropdown-visible-change="handleUserDropdownChange"
                @popup-scroll="handleUserScroll" 
                allow-clear 
                :loading="userSelectorLoading"
              >
                <template #notFoundContent>
                  <div v-if="userSelectorLoading" class="selector-loading">
                    <a-spin size="small" />
                    <span style="margin-left: 8px;">加载中...</span>
                  </div>
                  <div v-else class="selector-empty">
                    {{ userSearchKeyword ? '无搜索结果' : '暂无用户数据' }}
                  </div>
                </template>

                <a-select-option v-for="user in dialogUsers" :key="user.user_id" :value="user.user_id">
                  <div class="user-option">
                    <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(user.username) }">
                      {{ getInitials(user.username) }}
                    </a-avatar>
                    <span class="user-name">{{ user.username }}</span>
                    <span v-if="user.real_name" class="user-real-name">({{ user.real_name }})</span>
                  </div>
                </a-select-option>

                <a-select-option 
                  v-if="userPagination.hasMore" 
                  :value="'__load_more_user__'" 
                  disabled
                  class="load-more-option"
                >
                  <div class="load-more-content" @click.stop="loadMoreUsers">
                    <a-button 
                      type="link" 
                      size="small" 
                      :loading="userSelectorLoading"
                      style="padding: 0; height: auto; font-size: 12px;"
                    >
                      <template v-if="!userSelectorLoading">
                        加载更多 ({{ userPagination.current }}/{{ userTotalPages }})
                      </template>
                      <template v-else>
                        正在加载...
                      </template>
                    </a-button>
                  </div>
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="instanceDialog.form.description" :rows="4" placeholder="请输入工单描述" />
        </a-form-item>

        <a-form-item label="表单数据" name="form_data" v-if="instanceDialog.form.process_id">
          <div class="form-data-section">
            <div class="section-header">
              <h4>表单字段数据 (JSON格式)</h4>
              <div class="header-actions">
                <a-button size="small" @click="formatFormDataJson" :disabled="!instanceDialog.form.form_data_json">
                  格式化
                </a-button>
                <a-button size="small" @click="validateFormDataJson" :disabled="!instanceDialog.form.form_data_json">
                  验证
                </a-button>
              </div>
            </div>

            <a-textarea 
              v-model:value="instanceDialog.form.form_data_json" 
              placeholder="请输入表单数据JSON..." 
              :rows="8"
              class="json-editor" 
              :class="{ 'json-error': formDataValidationError }" 
            />

            <div v-if="formDataValidationError" class="json-error-message">
              <a-alert 
                type="error" 
                :message="formDataValidationError" 
                show-icon 
                closable
                @close="formDataValidationError = ''" 
              />
            </div>

            <div class="json-help">
              <a-alert 
                type="info" 
                message="表单数据说明" 
                description="请输入符合流程表单字段的JSON数据，例如：{&quot;name&quot;: &quot;张三&quot;, &quot;email&quot;: &quot;zhangsan@example.com&quot;}" 
                show-icon 
              />
            </div>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 详情对话框 -->
    <a-modal 
      :open="detailDialog.visible" 
      title="工单详情" 
      :width="previewDialogWidth" 
      :footer="null"
      @cancel="() => { detailDialog.visible = false }" 
      class="detail-dialog responsive-modal"
    >
      <div v-if="detailDialog.instance" class="instance-details">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ detailDialog.instance.title }}</h2>
            <div class="meta-info">
              <a-tag :color="getStatusColor(detailDialog.instance.status)">
                {{ getStatusText(detailDialog.instance.status) }}
              </a-tag>
              <a-tag :color="getPriorityColor(detailDialog.instance.priority)">
                {{ getPriorityText(detailDialog.instance.priority) }}
              </a-tag>
              <span class="serial-number">{{ detailDialog.instance.serial_number }}</span>
            </div>
          </div>
        </div>

        <a-descriptions bordered :column="2" :labelStyle="{ width: '120px' }">
          <a-descriptions-item label="工单ID">{{ detailDialog.instance.id }}</a-descriptions-item>
          <a-descriptions-item label="工单编号">{{ detailDialog.instance.serial_number }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.instance.operator_name }}</a-descriptions-item>
          <a-descriptions-item label="处理人">
            {{ getAssigneeName(detailDialog.instance.assignee_id) || '未分配' }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">
            {{ formatFullDateTime(detailDialog.instance.created_at || '') }}
          </a-descriptions-item>
          <a-descriptions-item label="更新时间">
            {{ formatFullDateTime(detailDialog.instance.updated_at || '') }}
          </a-descriptions-item>
          <a-descriptions-item label="完成时间" :span="2" v-if="detailDialog.instance.completed_at">
            {{ formatFullDateTime(detailDialog.instance.completed_at) }}
          </a-descriptions-item>
          <a-descriptions-item label="截止时间" :span="2" v-if="detailDialog.instance.due_date">
            {{ formatFullDateTime(detailDialog.instance.due_date) }}
          </a-descriptions-item>
          <a-descriptions-item label="标签" :span="2" v-if="detailDialog.instance.tags && detailDialog.instance.tags.length > 0">
            <a-tag v-for="tag in detailDialog.instance.tags" :key="tag" color="blue">{{ tag }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="关联流程" :span="2">
            {{ getProcessName(detailDialog.instance.process_id) || '无' }}
          </a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">
            {{ detailDialog.instance.description || '无描述' }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="form-data-preview" v-if="detailDialog.instance.form_data">
          <h3>表单数据</h3>
          <div class="form-data-content">
            <pre class="json-content">{{ JSON.stringify(detailDialog.instance.form_data, null, 2) }}</pre>
          </div>
        </div>

        <div class="detail-footer">
          <a-button @click="detailDialog.visible = false">关闭</a-button>
          <a-button 
            type="primary" 
            @click="handleEditInstance(detailDialog.instance)" 
            v-if="detailDialog.instance.status === InstanceStatus.Draft"
          >
            编辑
          </a-button>
          <a-button type="default" @click="handleViewTimeline(detailDialog.instance)">查看时间线</a-button>
          <a-button type="default" @click="handleViewComments(detailDialog.instance)">查看评论</a-button>
          <a-button type="default" @click="handleViewFlow(detailDialog.instance)">查看流转</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 评论对话框 -->
    <a-modal 
      :open="commentDialog.visible" 
      title="添加评论" 
      :width="dialogWidth" 
      @ok="saveComment"
      @cancel="() => { commentDialog.visible = false }" 
      :destroy-on-close="true" 
      class="responsive-modal"
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

    <!-- 时间线对话框 -->
    <a-modal 
      :open="timelineDialog.visible" 
      title="工单时间线" 
      :width="previewDialogWidth" 
      :footer="null"
      @cancel="() => { timelineDialog.visible = false }" 
      class="timeline-dialog responsive-modal"
    >
      <div class="timeline-content">
        <a-timeline>
          <a-timeline-item 
            v-for="item in timelineList" 
            :key="item.id" 
            :color="getTimelineColor(item.action)"
          >
            <template #dot>
              <component :is="getTimelineIcon(item.action)" />
            </template>
            <div class="timeline-item">
              <div class="timeline-header">
                <span class="action-type">{{ getActionText(item.action) }}</span>
                <span class="action-time">{{ formatFullDateTime(item.created_at) }}</span>
              </div>
              <div class="action-content">
                <div class="operator-info">
                  <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(item.operator_name || '') }">
                    {{ getInitials(item.operator_name) }}
                  </a-avatar>
                  <span class="operator-name">{{ item.operator_name }}</span>
                </div>
                <div class="action-comment" v-if="item.comment">
                  {{ item.comment }}
                </div>
                <div class="action-data" v-if="item.action_detail">
                  <pre class="json-content">{{ JSON.stringify(JSON.parse(item.action_detail), null, 2) }}</pre>
                </div>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
        <div v-if="timelineList.length === 0" class="empty-timeline">
          <a-empty description="暂无时间线记录" />
        </div>
      </div>
    </a-modal>

    <!-- 流转记录对话框 -->
    <a-modal 
      :open="flowDialog.visible" 
      title="工单流转记录" 
      :width="previewDialogWidth" 
      :footer="null"
      @cancel="() => { flowDialog.visible = false }" 
      class="flow-dialog responsive-modal"
    >
      <div class="flow-content">
        <a-timeline>
          <a-timeline-item 
            v-for="item in flowList" 
            :key="item.id" 
            :color="getFlowActionColor(item.action)"
          >
            <template #dot>
              <component :is="getFlowActionIcon(item.action)" />
            </template>
            <div class="flow-item">
              <div class="flow-header">
                <span class="flow-action">{{ getFlowActionText(item.action) }}</span>
                <span class="flow-time">{{ formatFullDateTime(item.created_at) }}</span>
              </div>
              <div class="flow-content-detail">
                <div class="operator-info">
                  <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(item.operator_name || '') }">
                    {{ getInitials(item.operator_name) }}
                  </a-avatar>
                  <span class="operator-name">{{ item.operator_name }}</span>
                  <a-tag v-if="item.is_system_action === 1" color="orange" size="small">系统</a-tag>
                </div>
                <div class="status-change">
                  <span class="from-status">{{ getStatusText(item.from_status) }}</span>
                  <span class="arrow">→</span>
                  <span class="to-status">{{ getStatusText(item.to_status) }}</span>
                </div>
                <div class="flow-comment" v-if="item.comment">
                  <strong>处理说明：</strong>{{ item.comment }}
                </div>
              </div>
            </div>
          </a-timeline-item>
        </a-timeline>
        <div v-if="flowList.length === 0" class="empty-flow">
          <a-empty description="暂无流转记录" />
        </div>
      </div>
    </a-modal>

    <!-- 分配处理人对话框 -->
    <a-modal 
      :open="assignDialog.visible" 
      title="分配处理人" 
      :width="dialogWidth" 
      @ok="saveAssign"
      @cancel="() => { assignDialog.visible = false }" 
      :destroy-on-close="true" 
      class="responsive-modal"
    >
      <a-form :model="assignDialog.form" layout="vertical">
        <a-form-item label="选择处理人" name="assignee_id" :rules="[{ required: true, message: '请选择处理人' }]">
          <a-select 
            v-model:value="assignDialog.form.assignee_id" 
            placeholder="请选择处理人" 
            style="width: 100%"
            show-search 
            :filter-option="false" 
            option-label-prop="children"
            :not-found-content="userSelectorLoading ? undefined : (userSearchKeyword ? '无搜索结果' : '无数据')"
            @search="handleUserSearch" 
            @dropdown-visible-change="handleUserDropdownChange"
            allow-clear 
            :loading="userSelectorLoading"
          >
            <template #notFoundContent>
              <div v-if="userSelectorLoading" class="selector-loading">
                <a-spin size="small" />
                <span style="margin-left: 8px;">加载中...</span>
              </div>
              <div v-else class="selector-empty">
                {{ userSearchKeyword ? '无搜索结果' : '暂无用户数据' }}
              </div>
            </template>

            <a-select-option v-for="user in dialogUsers" :key="user.user_id" :value="user.user_id">
              <div class="user-option">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(user.username) }">
                  {{ getInitials(user.username) }}
                </a-avatar>
                <span class="user-name">{{ user.username }}</span>
                <span v-if="user.real_name" class="user-real-name">({{ user.real_name }})</span>
              </div>
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 审批/拒绝对话框 -->
    <a-modal 
      :open="approvalDialog.visible" 
      :title="approvalDialog.type === 'approve' ? '审批通过' : '拒绝工单'" 
      :width="dialogWidth" 
      @ok="saveApproval"
      @cancel="() => { approvalDialog.visible = false }" 
      :destroy-on-close="true" 
      class="responsive-modal"
    >
      <a-form :model="approvalDialog.form" layout="vertical">
        <a-form-item 
          :label="approvalDialog.type === 'approve' ? '审批意见' : '拒绝理由'" 
          name="comment" 
          :rules="approvalDialog.type === 'reject' ? [{ required: true, message: '请输入拒绝理由' }] : []"
        >
          <a-textarea 
            v-model:value="approvalDialog.form.comment" 
            :rows="4" 
            :placeholder="approvalDialog.type === 'approve' ? '请输入审批意见(可选)' : '请输入拒绝理由'" 
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  DownOutlined,
  MessageOutlined,
  HistoryOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  PlayCircleOutlined,
  SendOutlined,
  StopOutlined
} from '@ant-design/icons-vue';

import {
  type WorkorderInstanceItem,
  type CreateWorkorderInstanceReq,
  type UpdateWorkorderInstanceReq,
  type DeleteWorkorderInstanceReq,
  type ListWorkorderInstanceReq,
  type DetailWorkorderInstanceReq,
  type SubmitWorkorderInstanceReq,
  type AssignWorkorderInstanceReq,
  type ApproveWorkorderInstanceReq,
  type RejectWorkorderInstanceReq,
  InstanceStatus,
  Priority,
  listWorkorderInstance,
  detailWorkorderInstance,
  createWorkorderInstance,
  updateWorkorderInstance,
  deleteWorkorderInstance,
  submitWorkorderInstance,
  assignWorkorderInstance,
  approveWorkorderInstance,
  rejectWorkorderInstance
} from '#/api/core/workorder_instance';

import {
  type WorkorderInstanceCommentItem,
  type CreateWorkorderInstanceCommentReq,
  type GetInstanceCommentsTreeReq,
  createWorkorderInstanceComment,
  getInstanceCommentsTree
} from '#/api/core/workorder_instance_comment';

import {
  type WorkorderInstanceTimelineItem,
  type ListWorkorderInstanceTimelineReq,
  TimelineAction,
  listWorkorderInstanceTimeline
} from '#/api/core/workorder_instance_time_line';

import {
  type WorkorderInstanceFlowItem,
  type ListWorkorderInstanceFlowReq,
  FlowAction,
  listWorkorderInstanceFlow
} from '#/api/core/workorder_instance_flow';

import {
  type GetUserListReq,
  getUserList
} from '#/api/core/user';

import type { UserInfo } from '@vben/types';

// 列定义
const columns = [
  {
    title: '工单标题',
    dataIndex: 'title',
    key: 'title',
    width: 250,
    fixed: 'left'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '创建人',
    dataIndex: 'operator_name',
    key: 'operator',
    width: 150,
  },
  {
    title: '处理人',
    dataIndex: 'assignee_id',
    key: 'assignee',
    width: 150,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    align: 'center' as const,
    fixed: 'right'
  },
];

// 状态数据
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<number | undefined>(undefined);
const priorityFilter = ref<number | undefined>(undefined);
const processFilter = ref<number | undefined>(undefined);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 数据列表
const instanceList = ref<WorkorderInstanceItem[]>([]);
const processes = ref<any[]>([]);

// 主用户数据 - 实现真分页
const users = ref<UserInfo[]>([]);
const usersPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});
const usersLoading = ref(false);
const usersSearchKeyword = ref('');
let usersSearchTimeout: any = null;

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  processing: 0,
  completed: 0
});

// 分页配置
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '50', '100'],
}));

// 工单对话框
const instanceDialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    id: undefined,
    title: '',
    description: '',
    priority: Priority.Normal,
    process_id: 0,
    assignee_id: undefined,
    form_data_json: ''
  } as CreateWorkorderInstanceReq & { id?: number; form_data_json?: string }
});

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { min: 3, max: 100, message: '长度应为3到100个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  process_id: [
    { required: true, message: '请选择关联流程', trigger: 'change' }
  ]
};

// 详情对话框
const detailDialog = reactive({
  visible: false,
  instance: null as WorkorderInstanceItem | null
});

// 评论对话框
const commentDialog = reactive({
  visible: false,
  form: {
    instance_id: 0,
    content: '',
    is_system: 0
  } as CreateWorkorderInstanceCommentReq
});

// 评论查看对话框
const commentsViewDialog = reactive({
  visible: false,
  instanceId: 0
});

const commentsList = ref<WorkorderInstanceCommentItem[]>([]);

// 时间线对话框
const timelineDialog = reactive({
  visible: false,
  instanceId: 0
});

const timelineList = ref<WorkorderInstanceTimelineItem[]>([]);

// 流转记录对话框
const flowDialog = reactive({
  visible: false,
  instanceId: 0
});

const flowList = ref<WorkorderInstanceFlowItem[]>([]);

// 分配处理人对话框
const assignDialog = reactive({
  visible: false,
  instanceId: 0,
  form: {
    assignee_id: 0
  }
});

// 审批对话框
const approvalDialog = reactive({
  visible: false,
  instanceId: 0,
  type: 'approve' as 'approve' | 'reject',
  form: {
    comment: ''
  }
});

// JSON验证错误
const formDataValidationError = ref('');

// 流程选择器相关
const dialogProcesses = ref<any[]>([]);
const processSelectorLoading = ref(false);
const processSearchKeyword = ref('');
let processSearchTimeout: any = null;

const processPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 用户选择器相关
const dialogUsers = ref<UserInfo[]>([]);
const userSelectorLoading = ref(false);
const userSearchKeyword = ref('');
let userSearchTimeout: any = null;

const userPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 响应式对话框宽度
const dialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '80%';
    return '600px';
  }
  return '600px';
});

const formDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '900px';
  }
  return '900px';
});

const previewDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '80%';
  }
  return '80%';
});

const processTotalPages = computed(() => {
  return Math.ceil(processPagination.total / processPagination.pageSize);
});

const userTotalPages = computed(() => {
  return Math.ceil(userPagination.total / userPagination.pageSize);
});

// 辅助方法
const getStatusColor = (status: number): string => {
  const colorMap = {
    [InstanceStatus.Draft]: 'default',
    [InstanceStatus.Pending]: 'orange',
    [InstanceStatus.Processing]: 'blue',
    [InstanceStatus.Completed]: 'green',
    [InstanceStatus.Rejected]: 'red',
    [InstanceStatus.Cancelled]: 'default'
  };
  return colorMap[status as keyof typeof colorMap] || 'default';
};

const getStatusText = (status: number): string => {
  const textMap = {
    [InstanceStatus.Draft]: '草稿',
    [InstanceStatus.Pending]: '待处理',
    [InstanceStatus.Processing]: '处理中',
    [InstanceStatus.Completed]: '已完成',
    [InstanceStatus.Rejected]: '已拒绝',
    [InstanceStatus.Cancelled]: '已取消'
  };
  return textMap[status as keyof typeof textMap] || '未知';
};

const getPriorityColor = (priority: number): string => {
  const colorMap = {
    [Priority.Low]: 'green',
    [Priority.Normal]: 'blue',
    [Priority.High]: 'red'
  };
  return colorMap[priority as keyof typeof colorMap] || 'blue';
};

const getPriorityText = (priority: number): string => {
  const textMap = {
    [Priority.Low]: '低',
    [Priority.Normal]: '普通',
    [Priority.High]: '高'
  };
  return textMap[priority as keyof typeof textMap] || '普通';
};

const getPriorityClass = (priority: number): string => {
  const classMap = {
    [Priority.Low]: 'priority-low',
    [Priority.Normal]: 'priority-normal',
    [Priority.High]: 'priority-high'
  };
  return classMap[priority as keyof typeof classMap] || 'priority-normal';
};

// 修改getAssigneeName方法 - 支持动态加载
const getAssigneeName = (assigneeId?: number): string => {
  if (!assigneeId) return '';
  
  // 先从已加载的用户中查找
  const user = users.value.find((u: UserInfo) => u.user_id === assigneeId.toString());
  if (user) {
    return user.username;
  }
  
  // 如果没找到且还有更多数据，触发加载
  if (usersPagination.hasMore && !usersLoading.value) {
    loadMoreMainUsers();
  }
  
  return `用户${assigneeId}`;
};

const getProcessName = (processId: number): string => {
  const process = processes.value.find(p => p.id === processId);
  return process?.name || `流程${processId}`;
};

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatTime = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatFullDateTime = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getInitials = (name: string | undefined) => {
  if (!name) return '';
  return name
    .split('')
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getAvatarColor = (name: string | undefined) => {
  if (!name) return '#1890ff';

  const colors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const getTimelineColor = (action: string): string => {
  const colorMap: Record<string, string> = {
    [TimelineAction.Create]: 'green',
    [TimelineAction.Update]: 'blue',
    [TimelineAction.Submit]: 'orange',
    [TimelineAction.Assign]: 'purple',
    [TimelineAction.Approve]: 'green',
    [TimelineAction.Reject]: 'red',
    [TimelineAction.Cancel]: 'gray',
    [TimelineAction.Complete]: 'green',
    [TimelineAction.Return]: 'orange',
    [TimelineAction.Comment]: 'blue',
    [TimelineAction.View]: 'cyan',
    [TimelineAction.Attach]: 'purple',
    [TimelineAction.Notify]: 'orange',
    [TimelineAction.Remind]: 'red'
  };
  return colorMap[action] || 'blue';
};

const getTimelineIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    [TimelineAction.Create]: PlusOutlined,
    [TimelineAction.Update]: EditOutlined,
    [TimelineAction.Submit]: SendOutlined,
    [TimelineAction.Assign]: UserOutlined,
    [TimelineAction.Approve]: CheckCircleOutlined,
    [TimelineAction.Reject]: ExclamationCircleOutlined,
    [TimelineAction.Cancel]: StopOutlined,
    [TimelineAction.Complete]: CheckCircleOutlined,
    [TimelineAction.Return]: ExclamationCircleOutlined,
    [TimelineAction.Comment]: MessageOutlined,
    [TimelineAction.View]: FileTextOutlined,
    [TimelineAction.Attach]: PlusOutlined,
    [TimelineAction.Notify]: MessageOutlined,
    [TimelineAction.Remind]: ExclamationCircleOutlined
  };
  return iconMap[action] || EditOutlined;
};

const getActionText = (action: string): string => {
  const textMap: Record<string, string> = {
    [TimelineAction.Create]: '创建工单',
    [TimelineAction.Update]: '更新工单',
    [TimelineAction.Submit]: '提交工单',
    [TimelineAction.Assign]: '分配处理人',
    [TimelineAction.Approve]: '审批通过',
    [TimelineAction.Reject]: '拒绝工单',
    [TimelineAction.Cancel]: '取消工单',
    [TimelineAction.Complete]: '完成工单',
    [TimelineAction.Return]: '退回工单',
    [TimelineAction.Comment]: '添加评论',
    [TimelineAction.View]: '查看工单',
    [TimelineAction.Attach]: '添加附件',
    [TimelineAction.Notify]: '发送通知',
    [TimelineAction.Remind]: '催办提醒'
  };
  return textMap[action] || action;
};

const getFlowActionColor = (action: string): string => {
  const colorMap: Record<string, string> = {
    [FlowAction.Submit]: 'orange',
    [FlowAction.Approve]: 'green',
    [FlowAction.Reject]: 'red',
    [FlowAction.Assign]: 'purple',
    [FlowAction.Cancel]: 'gray',
    [FlowAction.Complete]: 'green',
    [FlowAction.Return]: 'orange'
  };
  return colorMap[action] || 'blue';
};

const getFlowActionIcon = (action: string) => {
  const iconMap: Record<string, any> = {
    [FlowAction.Submit]: SendOutlined,
    [FlowAction.Approve]: CheckCircleOutlined,
    [FlowAction.Reject]: ExclamationCircleOutlined,
    [FlowAction.Assign]: UserOutlined,
    [FlowAction.Cancel]: StopOutlined,
    [FlowAction.Complete]: CheckCircleOutlined,
    [FlowAction.Return]: ExclamationCircleOutlined
  };
  return iconMap[action] || PlayCircleOutlined;
};

const getFlowActionText = (action: string): string => {
  const textMap: Record<string, string> = {
    [FlowAction.Submit]: '提交工单',
    [FlowAction.Approve]: '审批通过',
    [FlowAction.Reject]: '审批拒绝',
    [FlowAction.Assign]: '指派处理人',
    [FlowAction.Cancel]: '取消工单',
    [FlowAction.Complete]: '完成工单',
    [FlowAction.Return]: '退回工单'
  };
  return textMap[action] || action;
};

// JSON处理方法
const formatFormDataJson = (): void => {
  try {
    if (!instanceDialog.form.form_data_json?.trim()) {
      message.warning('请先输入JSON内容');
      return;
    }
    const parsed = JSON.parse(instanceDialog.form.form_data_json);
    instanceDialog.form.form_data_json = JSON.stringify(parsed, null, 2);
    formDataValidationError.value = '';
    message.success('JSON格式化成功');
  } catch (error) {
    formDataValidationError.value = `JSON格式错误: ${(error as Error).message}`;
    message.error('JSON格式化失败');
  }
};

const validateFormDataJson = (): void => {
  try {
    if (!instanceDialog.form.form_data_json?.trim()) {
      formDataValidationError.value = '';
      message.info('JSON内容为空');
      return;
    }

    JSON.parse(instanceDialog.form.form_data_json);
    formDataValidationError.value = '';
    message.success('JSON验证通过');
  } catch (error) {
    formDataValidationError.value = `验证失败: ${(error as Error).message}`;
    message.error('JSON验证失败');
  }
};

// 主用户数据加载方法 - 实现真分页
const loadUsers = async (reset: boolean = false, search?: string): Promise<void> => {
  if (usersLoading.value && !reset) {
    return;
  }

  usersLoading.value = true;

  try {
    const params: GetUserListReq = {
      page: reset ? 1 : usersPagination.current,
      size: usersPagination.pageSize,
      search: search || usersSearchKeyword.value || ''
    };

    const res = await getUserList(params);
    
    if (res && res.items) {
      if (reset) {
        users.value = res.items;
        usersPagination.current = 1;
      } else {
        // 追加模式，用于加载更多
        users.value = [...users.value, ...res.items];
        usersPagination.current += 1;
      }

      usersPagination.total = res.total || 0;
      usersPagination.hasMore = (usersPagination.current * usersPagination.pageSize) < usersPagination.total;
    } else {
      if (reset) {
        users.value = [];
        usersPagination.current = 1;
        usersPagination.total = 0;
        usersPagination.hasMore = false;
      }
    }
  } catch (error: any) {
    console.error('加载用户数据失败:', error);
    if (reset) {
      message.error(error.message || '加载用户数据失败');
      users.value = [];
      usersPagination.current = 1;
      usersPagination.total = 0;
      usersPagination.hasMore = false;
    }
  } finally {
    usersLoading.value = false;
  }
};

// 加载更多主用户数据的方法
const loadMoreMainUsers = async (): Promise<void> => {
  if (!usersPagination.hasMore || usersLoading.value) {
    return;
  }

  await loadUsers(false);
};

// 流程选择器方法
const loadDialogProcesses = async (reset: boolean = false, search?: string): Promise<void> => {
  if (processSelectorLoading.value && !reset) {
    return;
  }

  processSelectorLoading.value = true;

  try {
    const params: GetUserListReq = {
      page: 1,
      size: 10,
      search: '',
    };
    const res = await getUserList(params);
    const mockProcesses = res.items || [];

    if (reset) {
      dialogProcesses.value = mockProcesses;
      processPagination.current = 1;
    }

    processPagination.total = mockProcesses.length;
    processPagination.hasMore = false;
  } catch (error: any) {
    console.error('加载流程列表失败:', error);
    if (reset) {
      message.error(error.message || '加载流程列表失败');
      dialogProcesses.value = [];
      processPagination.current = 1;
      processPagination.total = 0;
      processPagination.hasMore = false;
    }
  } finally {
    processSelectorLoading.value = false;
  }
};

const handleProcessSearch = (value: string): void => {
  processSearchKeyword.value = value;

  if (processSearchTimeout) {
    clearTimeout(processSearchTimeout);
  }

  processSearchTimeout = setTimeout(() => {
    processPagination.current = 1;
    loadDialogProcesses(true, value);
  }, 300);
};

const handleProcessDropdownChange = (open: boolean): void => {
  if (open) {
    if (dialogProcesses.value.length === 0) {
      loadDialogProcesses(true);
    }
  }
};

const handleProcessScroll = (e: Event): void => {
  const { target } = e;
  if (!target) return;

  const element = target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = element;

  if (scrollTop + clientHeight >= scrollHeight - 10 &&
    processPagination.hasMore &&
    !processSelectorLoading.value) {
    loadMoreProcesses();
  }
};

const loadMoreProcesses = async (): Promise<void> => {
  if (!processPagination.hasMore || processSelectorLoading.value) {
    return;
  }

  processPagination.current += 1;
  await loadDialogProcesses(false);
};

// 用户选择器方法 - 实现真分页
const loadDialogUsers = async (reset: boolean = false, search?: string): Promise<void> => {
  if (userSelectorLoading.value && !reset) {
    return;
  }

  userSelectorLoading.value = true;

  try {
    const params: GetUserListReq = {
      page: reset ? 1 : userPagination.current,
      size: userPagination.pageSize,
      search: search || userSearchKeyword.value || ''
    };

    const res = await getUserList(params);
    
    if (res && res.items) {
      if (reset) {
        dialogUsers.value = res.items;
        userPagination.current = 1;
      } else {
        // 追加模式，用于加载更多
        dialogUsers.value = [...dialogUsers.value, ...res.items];
        userPagination.current += 1;
      }

      userPagination.total = res.total || 0;
      userPagination.hasMore = (userPagination.current * userPagination.pageSize) < userPagination.total;
    } else {
      if (reset) {
        dialogUsers.value = [];
        userPagination.current = 1;
        userPagination.total = 0;
        userPagination.hasMore = false;
      }
    }
  } catch (error: any) {
    console.error('加载用户列表失败:', error);
    if (reset) {
      message.error(error.message || '加载用户列表失败');
      dialogUsers.value = [];
      userPagination.current = 1;
      userPagination.total = 0;
      userPagination.hasMore = false;
    }
  } finally {
    userSelectorLoading.value = false;
  }
};

const handleUserSearch = (value: string): void => {
  userSearchKeyword.value = value;

  if (userSearchTimeout) {
    clearTimeout(userSearchTimeout);
  }

  userSearchTimeout = setTimeout(() => {
    userPagination.current = 1;
    loadDialogUsers(true, value);
  }, 300);
};

const handleUserDropdownChange = (open: boolean): void => {
  if (open) {
    if (dialogUsers.value.length === 0) {
      loadDialogUsers(true);
    }
  }
};

const handleUserScroll = (e: Event): void => {
  const { target } = e;
  if (!target) return;

  const element = target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = element;

  if (scrollTop + clientHeight >= scrollHeight - 10 &&
    userPagination.hasMore &&
    !userSelectorLoading.value) {
    loadMoreUsers();
  }
};

const loadMoreUsers = async (): Promise<void> => {
  if (!userPagination.hasMore || userSelectorLoading.value) {
    return;
  }

  await loadDialogUsers(false);
};

// 表格变化处理
const handleTableChange = (pagination: any): void => {
  if (pagination.current !== currentPage.value) {
    currentPage.value = pagination.current;
  }
  if (pagination.pageSize !== pageSize.value) {
    pageSize.value = pagination.pageSize;
    currentPage.value = 1;
  }
  loadInstances();
};

// 数据加载
const loadInstances = async () => {
  loading.value = true;
  try {
    const params: ListWorkorderInstanceReq = {
      page: currentPage.value,
      size: pageSize.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      priority: priorityFilter.value || undefined,
      process_id: processFilter.value || undefined
    };

    const res = await listWorkorderInstance(params);
    if (res && res.items) {
      instanceList.value = res.items || [];
      total.value = res.total || 0;
      
      // 更新统计数据
      updateStats();
    }
  } catch (error) {
    message.error('加载工单数据失败');
    console.error('Failed to load instances:', error);
  } finally {
    loading.value = false;
  }
};

const updateStats = () => {
  stats.total = instanceList.value.length;
  stats.pending = instanceList.value.filter(item => item.status === InstanceStatus.Pending).length;
  stats.processing = instanceList.value.filter(item => item.status === InstanceStatus.Processing).length;
  stats.completed = instanceList.value.filter(item => item.status === InstanceStatus.Completed).length;
};

// 事件处理
const handleSearch = () => {
  currentPage.value = 1;
  loadInstances();
};

const handleStatusChange = () => {
  currentPage.value = 1;
  loadInstances();
};

const handlePriorityChange = () => {
  currentPage.value = 1;
  loadInstances();
};

const handleProcessChange = () => {
  currentPage.value = 1;
  loadInstances();
};

const handleCreateInstance = () => {
  instanceDialog.isEdit = false;
  instanceDialog.form = {
    title: '',
    description: '',
    priority: Priority.Normal,
    process_id: 0,
    assignee_id: undefined,
    form_data_json: '',
    form_data: {},
    status: 1
  };
  formDataValidationError.value = '';
  instanceDialog.visible = true;
  resetSelectors();
};

const handleEditInstance = async (row: WorkorderInstanceItem) => {
  instanceDialog.isEdit = true;
  loading.value = true;

  try {
    const res = await detailWorkorderInstance({ id: row.id } as DetailWorkorderInstanceReq);
    if (res) {
      instanceDialog.form = {
        id: res.id,
        title: res.title,
        description: res.description,
        priority: res.priority,
        process_id: res.process_id,
        assignee_id: res.assignee_id,
        form_data_json: JSON.stringify(res.form_data || {}, null, 2),
        form_data: res.form_data,
        status: res.status
      };

      formDataValidationError.value = '';
      instanceDialog.visible = true;
      await loadSelectorsForEdit();
    }
  } catch (error) {
    message.error('获取工单详情失败');
    console.error('Failed to get instance details:', error);
  } finally {
    loading.value = false;
  }
};

const handleViewInstance = async (row: WorkorderInstanceItem) => {
  loading.value = true;

  try {
    const res = await detailWorkorderInstance({ id: row.id } as DetailWorkorderInstanceReq);
    if (res) {
      detailDialog.instance = res;
      detailDialog.visible = true;
    }
  } catch (error) {
    message.error('获取工单详情失败');
    console.error('Failed to get instance details:', error);
  } finally {
    loading.value = false;
  }
};

const handleCommand = async (command: string, row: WorkorderInstanceItem) => {
  switch (command) {
    case 'comment':
      showCommentDialog(row);
      break;
    case 'timeline':
      await handleViewTimeline(row);
      break;
    case 'flow':
      await handleViewFlow(row);
      break;
    case 'submit':
      await handleSubmitInstance(row);
      break;
    case 'assign':
      showAssignDialog(row);
      break;
    case 'approve':
      showApprovalDialog(row, 'approve');
      break;
    case 'reject':
      showApprovalDialog(row, 'reject');
      break;
    case 'delete':
      confirmDelete(row);
      break;
  }
};

const showCommentDialog = (instance: WorkorderInstanceItem) => {
  commentDialog.form = {
    instance_id: instance.id,
    content: '',
    is_system: 0
  };
  commentDialog.visible = true;
};

const saveComment = async () => {
  try {
    if (!commentDialog.form.content.trim()) {
      message.error('请输入评论内容');
      return;
    }

    loading.value = true;
    await createWorkorderInstanceComment(commentDialog.form);
    message.success('评论添加成功');
    commentDialog.visible = false;
  } catch (error: any) {
    message.error(`添加评论失败: ${error.message || '未知错误'}`);
    console.error('Failed to create comment:', error);
  } finally {
    loading.value = false;
  }
};

const handleViewComments = async (instance: WorkorderInstanceItem) => {
  commentsViewDialog.instanceId = instance.id;
  commentsViewDialog.visible = true;

  try {
    const params: GetInstanceCommentsTreeReq = {
      id: instance.id
    };

    const res = await getInstanceCommentsTree(params);
    if (res && res.items) {
      commentsList.value = res.items;
    } else {
      commentsList.value = [];
    }
  } catch (error: any) {
    console.error('Failed to load comments:', error);
    message.error(`加载评论失败: ${error.message || '未知错误'}`);
    commentsList.value = [];
  }
};

const handleViewTimeline = async (instance: WorkorderInstanceItem) => {
  timelineDialog.instanceId = instance.id;
  timelineDialog.visible = true;

  try {
    const params: ListWorkorderInstanceTimelineReq = {
      page: 1,
      size: 100,
      instance_id: instance.id
    };

    const res = await listWorkorderInstanceTimeline(params);
    if (res && res.items) {
      timelineList.value = res.items;
    } else {
      timelineList.value = [];
    }
  } catch (error: any) {
    console.error('Failed to load timeline:', error);
    message.error(`加载时间线失败: ${error.message || '未知错误'}`);
    timelineList.value = [];
  }
};

const handleViewFlow = async (instance: WorkorderInstanceItem) => {
  flowDialog.instanceId = instance.id;
  flowDialog.visible = true;

  try {
    const params: ListWorkorderInstanceFlowReq = {
      page: 1,
      size: 100,
      instance_id: instance.id
    };

    const res = await listWorkorderInstanceFlow(params);
    if (res && res.items) {
      flowList.value = res.items;
    } else {
      flowList.value = [];
    }
  } catch (error: any) {
    console.error('Failed to load flow:', error);
    message.error(`加载流转记录失败: ${error.message || '未知错误'}`);
    flowList.value = [];
  }
};

const handleSubmitInstance = async (instance: WorkorderInstanceItem) => {
  Modal.confirm({
    title: '提交确认',
    content: `确定要提交工单 "${instance.title}" 吗？提交后将无法撤回。`,
    okText: '提交',
    cancelText: '取消',
    async onOk() {
      try {
        loading.value = true;
        const params: SubmitWorkorderInstanceReq = {
          id: instance.id
        };

        await submitWorkorderInstance(params);
        message.success(`工单 "${instance.title}" 提交成功`);
        loadInstances();
      } catch (error: any) {
        message.error(`提交工单失败: ${error.message || '未知错误'}`);
        console.error('Failed to submit instance:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

const showAssignDialog = (instance: WorkorderInstanceItem) => {
  assignDialog.instanceId = instance.id;
  assignDialog.form.assignee_id = 0;
  assignDialog.visible = true;
  loadDialogUsers(true);
};

const saveAssign = async () => {
  try {
    if (!assignDialog.form.assignee_id) {
      message.error('请选择处理人');
      return;
    }

    loading.value = true;
    const params: AssignWorkorderInstanceReq = {
      id: assignDialog.instanceId,
      assignee_id: assignDialog.form.assignee_id
    };

    await assignWorkorderInstance(params);
    message.success('分配处理人成功');
    assignDialog.visible = false;
    loadInstances();
  } catch (error: any) {
    message.error(`分配处理人失败: ${error.message || '未知错误'}`);
    console.error('Failed to assign instance:', error);
  } finally {
    loading.value = false;
  }
};

const showApprovalDialog = (instance: WorkorderInstanceItem, type: 'approve' | 'reject') => {
  approvalDialog.instanceId = instance.id;
  approvalDialog.type = type;
  approvalDialog.form.comment = '';
  approvalDialog.visible = true;
};

const saveApproval = async () => {
  try {
    if (approvalDialog.type === 'reject' && !approvalDialog.form.comment.trim()) {
      message.error('请输入拒绝理由');
      return;
    }

    loading.value = true;

    if (approvalDialog.type === 'approve') {
      const params: ApproveWorkorderInstanceReq = {
        id: approvalDialog.instanceId,
        comment: approvalDialog.form.comment
      };
      await approveWorkorderInstance(params);
      message.success('审批通过成功');
    } else {
      const params: RejectWorkorderInstanceReq = {
        id: approvalDialog.instanceId,
        comment: approvalDialog.form.comment
      };
      await rejectWorkorderInstance(params);
      message.success('拒绝工单成功');
    }

    approvalDialog.visible = false;
    loadInstances();
  } catch (error: any) {
    message.error(`${approvalDialog.type === 'approve' ? '审批' : '拒绝'}失败: ${error.message || '未知错误'}`);
    console.error('Failed to process approval:', error);
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (instance: WorkorderInstanceItem) => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除工单 "${instance.title}" 吗？这个操作不可恢复！`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        loading.value = true;
        const params: DeleteWorkorderInstanceReq = {
          id: instance.id
        };

        await deleteWorkorderInstance(params);
        message.success(`工单 "${instance.title}" 已删除`);

        if (instanceList.value.length === 1 && currentPage.value > 1) {
          currentPage.value = currentPage.value - 1;
        }

        loadInstances();
      } catch (error: any) {
        message.error(`删除工单失败: ${error.message || '未知错误'}`);
        console.error('Failed to delete instance:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

const saveInstance = async () => {
  try {
    if (!instanceDialog.form.title.trim()) {
      message.error('工单标题不能为空');
      return;
    }

    if (!instanceDialog.form.process_id) {
      message.error('请选择关联流程');
      return;
    }

    // 解析表单数据JSON
    let formData = {};
    try {
      if (instanceDialog.form.form_data_json?.trim()) {
        formData = JSON.parse(instanceDialog.form.form_data_json);
      }
    } catch (error) {
      message.error('表单数据JSON格式错误');
      return;
    }

    loading.value = true;

    if (instanceDialog.isEdit && instanceDialog.form.id) {
      const updateData: UpdateWorkorderInstanceReq = {
        id: instanceDialog.form.id,
        title: instanceDialog.form.title,
        description: instanceDialog.form.description || '',
        priority: instanceDialog.form.priority,
        assignee_id: instanceDialog.form.assignee_id,
        form_data: formData
      };

      await updateWorkorderInstance(updateData);
      message.success(`工单 "${instanceDialog.form.title}" 已更新`);
    } else {
      const createData: CreateWorkorderInstanceReq = {
        title: instanceDialog.form.title,
        process_id: instanceDialog.form.process_id,
        form_data: formData,
        status: InstanceStatus.Draft,
        priority: instanceDialog.form.priority,
        assignee_id: instanceDialog.form.assignee_id,
        description: instanceDialog.form.description
      };

      await createWorkorderInstance(createData);
      message.success(`工单 "${instanceDialog.form.title}" 已创建`);

      currentPage.value = 1;
    }

    instanceDialog.visible = false;
    loadInstances();
  } catch (error: any) {
    message.error(instanceDialog.isEdit
      ? `更新工单失败: ${error.message || '未知错误'}`
      : `创建工单失败: ${error.message || '未知错误'}`
    );
    console.error('Failed to save instance:', error);
  } finally {
    loading.value = false;
  }
};

// 重置选择器状态
const resetSelectors = (): void => {
  // 重置流程选择器
  dialogProcesses.value = [];
  processPagination.current = 1;
  processPagination.total = 0;
  processPagination.hasMore = false;
  processSearchKeyword.value = '';
  processSelectorLoading.value = false;

  if (processSearchTimeout) {
    clearTimeout(processSearchTimeout);
    processSearchTimeout = null;
  }

  // 重置用户选择器
  dialogUsers.value = [];
  userPagination.current = 1;
  userPagination.total = 0;
  userPagination.hasMore = false;
  userSearchKeyword.value = '';
  userSelectorLoading.value = false;

  if (userSearchTimeout) {
    clearTimeout(userSearchTimeout);
    userSearchTimeout = null;
  }
};

// 为编辑模式加载选择器信息
const loadSelectorsForEdit = async (): Promise<void> => {
  resetSelectors();

  try {
    await Promise.all([
      loadDialogProcesses(true),
      loadDialogUsers(true)
    ]);
  } catch (error) {
    console.error('加载编辑模式选择器信息失败:', error);
  }
};

// 初始化加载
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadInstances(),
      loadUsers(true) // 初始化加载用户数据（第一页）
    ]);
  } catch (error: any) {
    console.error('初始化数据加载失败:', error);
    message.error(`初始化数据加载失败: ${error.message || '未知错误'}, 请刷新页面重试`);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.instance-management-container {
  padding: 12px;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.btn-create {
  background: linear-gradient(135deg, #1890ff 0%);
  border: none;
  flex-shrink: 0;
}

.search-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 300px;
  min-width: 200px;
}

.status-filter,
.priority-filter,
.process-filter {
  width: 120px;
  min-width: 100px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 100%;
}

.table-container {
  margin-bottom: 24px;
}

.instance-title-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.priority-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.priority-low {
  background-color: #52c41a;
}

.priority-normal {
  background-color: #1890ff;
}

.priority-high {
  background-color: #ff4d4f;
}

.title-content {
  flex: 1;
  min-width: 0;
}

.title-text {
  font-weight: 500;
  word-break: break-all;
  line-height: 1.4;
}

.serial-number {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 2px;
}

.text-gray {
  color: #999;
  font-style: italic;
}

.operator-info,
.assignee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operator-name,
.assignee-name {
  font-size: 14px;
  word-break: break-all;
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
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 选择器样式 */
.selector-loading,
.selector-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  color: #8c8c8c;
  font-size: 14px;
}

.process-option,
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.process-name,
.user-name {
  font-weight: 500;
  color: #262626;
}

.process-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.user-real-name {
  font-size: 12px;
  color: #8c8c8c;
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

/* 表单数据编辑样式 */
.form-data-section {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 16px;
  background: #fafafa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.json-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  transition: all 0.3s;
}

.json-editor:hover {
  border-color: #40a9ff;
}

.json-editor:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.json-error {
  border-color: #ff4d4f !important;
}

.json-error:focus {
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
}

.json-error-message {
  margin-top: 8px;
}

.json-help {
  margin-top: 12px;
}

/* 详情对话框样式 */
.detail-dialog .instance-details {
  margin-bottom: 20px;
}

.detail-header {
  margin-bottom: 24px;
}

.title-section h2 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #1f2937;
  word-break: break-all;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.serial-number {
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.form-data-preview {
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.form-data-preview h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 18px;
}

.form-data-content {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
}

.json-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #495057;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

/* 评论样式 */
.comments-content {
  max-height: 600px;
  overflow-y: auto;
}

.comments-list {
  space-y: 16px;
}

.comment-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.commenter-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.commenter-name {
  font-weight: 500;
  color: #1f2937;
}

.comment-time {
  font-size: 12px;
  color: #8c8c8c;
}

.comment-content {
  line-height: 1.6;
  color: #495057;
  margin-bottom: 12px;
}

.comment-replies {
  margin-left: 32px;
  border-left: 2px solid #e8e8e8;
  padding-left: 16px;
}

.reply-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.replier-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.replier-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.reply-time {
  font-size: 11px;
  color: #8c8c8c;
}

.reply-content {
  line-height: 1.5;
  color: #495057;
  font-size: 14px;
}

.empty-comments {
  text-align: center;
  padding: 40px 0;
}

/* 时间线样式 */
.timeline-content {
  max-height: 600px;
  overflow-y: auto;
}

.timeline-item {
  margin-bottom: 16px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.action-type {
  font-weight: 500;
  color: #1f2937;
}

.action-time {
  font-size: 12px;
  color: #8c8c8c;
}

.action-content {
  padding-left: 8px;
}

.action-comment {
  margin: 8px 0;
  color: #666;
  line-height: 1.5;
}

.action-data {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.empty-timeline {
  text-align: center;
  padding: 40px 0;
}

/* 流转记录样式 */
.flow-content {
  max-height: 600px;
  overflow-y: auto;
}

.flow-item {
  margin-bottom: 16px;
}

.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.flow-action {
  font-weight: 500;
  color: #1f2937;
}

.flow-time {
  font-size: 12px;
  color: #8c8c8c;
}

.flow-content-detail {
  padding-left: 8px;
}

.status-change {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.from-status,
.to-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.from-status {
  background: #f0f0f0;
  color: #666;
}

.to-status {
  background: #e6f7ff;
  color: #1890ff;
}

.arrow {
  color: #8c8c8c;
  font-weight: bold;
}

.flow-comment {
  margin-top: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
  line-height: 1.5;
  color: #495057;
}

.empty-flow {
  text-align: center;
  padding: 40px 0;
}

/* 响应式对话框 */
.responsive-modal :deep(.ant-modal) {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

.instance-form-modal :deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .instance-management-container {
    padding: 8px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-filters {
    width: 100%;
  }

  .search-input {
    width: 100%;
    min-width: auto;
  }

  .status-filter,
  .priority-filter,
  .process-filter {
    width: 100%;
    min-width: auto;
  }

  .btn-create {
    padding: 4px 8px;
    min-width: auto;
  }

  .stats-card :deep(.ant-statistic-title) {
    font-size: 12px;
  }

  .stats-card :deep(.ant-statistic-content) {
    font-size: 16px;
  }

  .action-buttons {
    gap: 2px;
  }

  .action-buttons .ant-btn {
    padding: 0 4px;
    font-size: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .json-editor {
    font-size: 12px;
  }

  .timeline-header,
  .flow-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .detail-footer {
    justify-content: center;
  }

  .detail-footer .ant-btn {
    flex: 1;
    max-width: 120px;
  }

  .meta-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .load-more-content {
    padding: 6px 8px;
  }

  .comment-header,
  .reply-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .status-change {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 平板端适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .instance-management-container {
    padding: 16px;
  }

  .search-input {
    width: 250px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .header-actions {
    gap: 8px;
  }

  .stats-card {
    text-align: center;
  }

  .operator-info,
  .assignee-info {
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .operator-name,
  .assignee-name {
    font-size: 12px;
  }

  .date-info {
    text-align: center;
  }

  .date {
    font-size: 12px;
  }

  .time {
    font-size: 10px;
  }

  .instance-title-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .priority-badge {
    align-self: flex-start;
  }

  .process-desc,
  .user-real-name {
    max-width: 120px;
  }

  .load-more-content {
    padding: 4px 6px;
    font-size: 12px;
  }

  .action-data {
    font-size: 10px;
  }
}

/* 表格滚动优化 */
.table-container :deep(.ant-table-wrapper) {
  overflow: auto;
}

.table-container :deep(.ant-table-thead > tr > th) {
  white-space: nowrap;
}

.table-container :deep(.ant-table-tbody > tr > td) {
  word-break: break-word;
}
</style>
