<template>
  <div class="process-management-container">
    <div class="page-header">
      <div class="header-actions">
        <a-button type="primary" @click="handleCreateProcess" class="btn-create">
          <template #icon>
            <PlusOutlined />
          </template>
          创建新流程
        </a-button>
        <div class="search-filters">
          <a-input-search v-model:value="searchQuery" placeholder="搜索流程..." class="search-input" @search="handleSearch"
            allow-clear />
          <a-select v-model:value="statusFilter" placeholder="状态" class="status-filter" @change="handleStatusChange">
            <a-select-option :value="null">全部</a-select-option>
            <a-select-option :value="1">草稿</a-select-option>
            <a-select-option :value="2">已发布</a-select-option>
            <a-select-option :value="3">已禁用</a-select-option>
          </a-select>
          <a-select v-model:value="categoryFilter" placeholder="分类" class="category-filter"
            @change="handleCategoryChange">
            <a-select-option :value="null">全部分类</a-select-option>
            <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </a-select-option>
          </a-select>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic title="总流程数" :value="stats.total" :value-style="{ color: '#3f8600' }">
              <template #prefix>
                <ApartmentOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic title="已发布" :value="stats.published" :value-style="{ color: '#52c41a' }">
              <template #prefix>
                <CheckCircleOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic title="草稿" :value="stats.draft" :value-style="{ color: '#faad14' }">
              <template #prefix>
                <EditOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        <a-col :span="6">
          <a-card class="stats-card">
            <a-statistic title="已禁用" :value="stats.disabled" :value-style="{ color: '#cf1322' }">
              <template #prefix>
                <StopOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <div class="table-container">
      <a-card>
        <a-table :data-source="processList" :columns="columns" :pagination="paginationConfig" :loading="loading"
          row-key="id" bordered :scroll="{ x: 1200 }" @change="handleTableChange">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="process-name-cell">
                <div class="process-badge" :class="getStatusClass(record.status)"></div>
                <span class="process-name-text">{{ record.name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'description'">
              <span class="description-text">{{ record.description || '无描述' }}</span>
            </template>

            <template v-if="column.key === 'version'">
              <a-tag color="blue">v{{ record.version }}</a-tag>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 1 ? 'orange' : record.status === 2 ? 'green' : 'default'">
                {{ record.status === 1 ? '草稿' : record.status === 2 ? '已发布' : '已禁用' }}
              </a-tag>
            </template>

            <template v-if="column.key === 'form_design'">
              <span>{{ getFormName(record.form_design_id) }}</span>
            </template>

            <template v-if="column.key === 'category'">
              <span>{{ getCategoryName(record.category_id) }}</span>
            </template>

            <template v-if="column.key === 'creator'">
              <div class="creator-info">
                <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(record.creator_name) }">
                  {{ getInitials(record.creator_name) }}
                </a-avatar>
                <span class="creator-name">{{ record.creator_name }}</span>
              </div>
            </template>

            <template v-if="column.key === 'createdAt'">
              <div class="date-info">
                <span class="date">{{ formatDate(record.created_at) }}</span>
                <span class="time">{{ formatTime(record.created_at) }}</span>
              </div>
            </template>

            <template v-if="column.key === 'action'">
              <div class="action-buttons">
                <a-button type="primary" size="small" @click="handleViewProcess(record)">
                  查看
                </a-button>
                <a-button type="default" size="small" @click="handleEditProcess(record)">
                  编辑
                </a-button>
                <a-dropdown>
                  <template #overlay>
                    <a-menu @click="(e: any) => handleCommand(e.key, record)">
                      <a-menu-item key="publish" v-if="record.status === 1">发布</a-menu-item>
                      <a-menu-item key="unpublish" v-if="record.status === 2">取消发布</a-menu-item>
                      <a-menu-item key="validate">验证流程</a-menu-item>
                      <a-menu-item key="clone">克隆</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger>删除</a-menu-item>
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

    <!-- 流程创建/编辑对话框 -->
    <a-modal :open="processDialog.visible" :title="processDialog.isEdit ? '编辑流程' : '创建流程'" :width="formDialogWidth"
      @ok="saveProcess" @cancel="() => { processDialog.visible = false }" :destroy-on-close="true"
      class="responsive-modal process-design-modal" :confirm-loading="loading">
      <a-form ref="formRef" :model="processDialog.form" :rules="formRules" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="流程名称" name="name">
              <a-input v-model:value="processDialog.form.name" placeholder="请输入流程名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="关联表单" name="form_design_id">
              <a-select v-model:value="processDialog.form.form_design_id" placeholder="请选择关联表单" style="width: 100%"
                show-search :filter-option="false" option-label-prop="children"
                :not-found-content="formSelectorLoading ? undefined : (formSearchKeyword ? '无搜索结果' : '无数据')"
                @search="handleFormSearch" @dropdown-visible-change="handleFormDropdownChange"
                @popup-scroll="handleFormScroll" allow-clear :loading="formSelectorLoading">
                <template #notFoundContent>
                  <div v-if="formSelectorLoading" class="selector-loading">
                    <a-spin size="small" />
                    <span style="margin-left: 8px;">加载中...</span>
                  </div>
                  <div v-else class="selector-empty">
                    {{ formSearchKeyword ? '无搜索结果' : '暂无表单数据' }}
                  </div>
                </template>

                <!-- 表单选项 -->
                <a-select-option v-for="form in processDialogForms" :key="form.id" :value="form.id">
                  <div class="form-option">
                    <span class="form-name">{{ form.name }}</span>
                    <span v-if="form.description" class="form-desc">{{ form.description }}</span>
                  </div>
                </a-select-option>

                <!-- 加载更多指示器 -->
                <a-select-option v-if="formPagination.hasMore" :value="'__load_more_form__'" disabled
                  class="load-more-option">
                  <div class="load-more-content" @click.stop="loadMoreForms">
                    <a-button type="link" size="small" :loading="formSelectorLoading"
                      style="padding: 0; height: auto; font-size: 12px;">
                      <template v-if="!formSelectorLoading">
                        加载更多 ({{ formPagination.current }}/{{ formTotalPages }})
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

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="分类" name="category_id">
              <a-select v-model:value="processDialog.form.category_id" placeholder="请选择分类" style="width: 100%"
                show-search :filter-option="false" option-label-prop="children"
                :not-found-content="categorySelectorLoading ? undefined : (categorySearchKeyword ? '无搜索结果' : '无数据')"
                @search="handleCategorySearch" @dropdown-visible-change="handleCategoryDropdownChange"
                @popup-scroll="handleCategoryScroll" allow-clear :loading="categorySelectorLoading">
                <template #notFoundContent>
                  <div v-if="categorySelectorLoading" class="selector-loading">
                    <a-spin size="small" />
                    <span style="margin-left: 8px;">加载中...</span>
                  </div>
                  <div v-else class="selector-empty">
                    {{ categorySearchKeyword ? '无搜索结果' : '暂无分类数据' }}
                  </div>
                </template>

                <!-- 分类选项 -->
                <a-select-option v-for="cat in processDialogCategories" :key="cat.id" :value="cat.id">
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
                        加载更多 ({{ categoryPagination.current }}/{{ totalPages }})
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
          <a-col :span="8">
            <a-form-item label="版本号" name="version">
              <a-input v-model:value="processDialog.form.version" placeholder="请输入版本号"
                :disabled="processDialog.isEdit" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态" name="status" v-if="processDialog.isEdit">
              <a-radio-group v-model:value="processDialog.form.status">
                <a-radio :value="1">草稿</a-radio>
                <a-radio :value="2">已发布</a-radio>
                <a-radio :value="3">已禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="processDialog.form.description" :rows="3" placeholder="请输入流程描述" />
        </a-form-item>

        <a-divider orientation="left">流程步骤定义</a-divider>

        <div class="steps-editor">
          <div class="step-list">
            <a-collapse v-model:activeKey="activeStepKeys">
              <a-collapse-panel v-for="(step, index) in processDialog.form.definition.steps" :key="index"
                :header="step.name || `步骤 ${index + 1}`">
                <template #extra>
                  <a-button type="text" danger @click.stop="removeStep(index)" size="small">
                    <DeleteOutlined />
                  </a-button>
                </template>

                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="步骤名称">
                      <a-input v-model:value="step.name" placeholder="步骤名称" />
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="步骤类型">
                      <a-select v-model:value="step.type" placeholder="选择步骤类型">
                        <a-select-option value="start">开始</a-select-option>
                        <a-select-option value="approval">审批</a-select-option>
                        <a-select-option value="task">任务</a-select-option>
                        <a-select-option value="decision">决策</a-select-option>
                        <a-select-option value="end">结束</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="角色">
                      <a-select v-model:value="step.roles" mode="multiple" placeholder="选择角色">
                        <a-select-option v-for="role in roles" :key="role" :value="role">
                          {{ role }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="用户ID">
                      <a-select v-model:value="step.users" mode="multiple" placeholder="选择用户" show-search
                        :filter-option="false" option-label-prop="children"
                        :not-found-content="userSelectorLoading ? undefined : (userSearchKeyword ? '无搜索结果' : '无数据')"
                        @search="handleUserSearch" @dropdown-visible-change="handleUserDropdownChange"
                        @popup-scroll="handleUserScroll" allow-clear :loading="userSelectorLoading">
                        <template #notFoundContent>
                          <div v-if="userSelectorLoading" class="selector-loading">
                            <a-spin size="small" />
                            <span style="margin-left: 8px;">加载中...</span>
                          </div>
                          <div v-else class="selector-empty">
                            {{ userSearchKeyword ? '无搜索结果' : '暂无用户数据' }}
                          </div>
                        </template>

                        <!-- 用户选项 -->
                        <a-select-option v-for="user in processDialogUsers" :key="user.id" :value="user.id">
                          <div class="user-option">
                            <a-avatar size="small" :style="{ backgroundColor: getAvatarColor(user.username) }">
                              {{ getInitials(user.username) }}
                            </a-avatar>
                            <span class="user-name">{{ user.username }}</span>
                            <span v-if="user.real_name" class="user-real-name">({{ user.real_name }})</span>
                          </div>
                        </a-select-option>

                        <!-- 加载更多指示器 -->
                        <a-select-option v-if="userPagination.hasMore" :value="'__load_more_user__'" disabled
                          class="load-more-option">
                          <div class="load-more-content" @click.stop="loadMoreUsers">
                            <a-button type="link" size="small" :loading="userSelectorLoading"
                              style="padding: 0; height: auto; font-size: 12px;">
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

                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item label="可执行动作">
                      <a-select v-model:value="step.actions" mode="multiple" placeholder="选择动作">
                        <a-select-option value="approve">同意</a-select-option>
                        <a-select-option value="reject">拒绝</a-select-option>
                        <a-select-option value="transfer">转交</a-select-option>
                        <a-select-option value="revoke">撤回</a-select-option>
                        <a-select-option value="cancel">取消</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item label="时间限制(分钟)">
                      <a-input-number v-model:value="step.time_limit" placeholder="时间限制" style="width: 100%" />
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-row :gutter="16">
                  <a-col :span="12">
                    <a-form-item>
                      <a-checkbox v-model:checked="step.auto_assign">自动分配</a-checkbox>
                    </a-form-item>
                  </a-col>
                  <a-col :span="12">
                    <a-form-item>
                      <a-checkbox v-model:checked="step.parallel">并行处理</a-checkbox>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-form-item label="步骤位置">
                  <a-row :gutter="16">
                    <a-col :span="12">
                      <a-input-number v-model:value="step.position.x" placeholder="X坐标" style="width: 100%" />
                    </a-col>
                    <a-col :span="12">
                      <a-input-number v-model:value="step.position.y" placeholder="Y坐标" style="width: 100%" />
                    </a-col>
                  </a-row>
                </a-form-item>
              </a-collapse-panel>
            </a-collapse>

            <div class="add-step-button">
              <a-button type="dashed" block @click="addStep" style="margin-top: 16px">
                <PlusOutlined /> 添加步骤
              </a-button>
            </div>
          </div>
        </div>

        <a-divider orientation="left">流程连接</a-divider>

        <div class="connections-editor">
          <div class="connection-list">
            <div v-for="(connection, index) in processDialog.form.definition.connections" :key="index"
              class="connection-item">
              <a-row :gutter="16" align="middle">
                <a-col :span="10">
                  <a-select v-model:value="connection.from" placeholder="来源步骤" class="select-step">
                    <a-select-option v-for="step in processDialog.form.definition.steps" :key="step.id"
                      :value="step.id">
                      {{ step.name }}
                    </a-select-option>
                  </a-select>
                </a-col>
                <a-col :span="10">
                  <a-select v-model:value="connection.to" placeholder="目标步骤" class="select-step">
                    <a-select-option v-for="step in processDialog.form.definition.steps" :key="step.id"
                      :value="step.id">
                      {{ step.name }}
                    </a-select-option>
                  </a-select>
                </a-col>
                <a-col :span="4">
                  <a-button type="text" danger @click="removeConnection(index)" size="small">
                    <DeleteOutlined />
                  </a-button>
                </a-col>
              </a-row>
              <a-row :gutter="16" style="margin-top: 8px">
                <a-col :span="12">
                  <a-input v-model:value="connection.condition" placeholder="条件表达式" />
                </a-col>
                <a-col :span="12">
                  <a-input v-model:value="connection.label" placeholder="连接标签" />
                </a-col>
              </a-row>
            </div>
            <a-button type="dashed" block @click="addConnection" style="margin-top: 16px">
              <PlusOutlined /> 添加连接
            </a-button>
          </div>
        </div>

        <a-divider orientation="left">流程变量</a-divider>

        <div class="variables-editor">
          <div class="variable-list">
            <div v-for="(variable, index) in processDialog.form.definition.variables" :key="index"
              class="variable-item">
              <a-row :gutter="16" align="middle">
                <a-col :span="5">
                  <a-input v-model:value="variable.name" placeholder="变量名" />
                </a-col>
                <a-col :span="4">
                  <a-select v-model:value="variable.type" placeholder="类型">
                    <a-select-option value="string">字符串</a-select-option>
                    <a-select-option value="number">数字</a-select-option>
                    <a-select-option value="boolean">布尔</a-select-option>
                    <a-select-option value="object">对象</a-select-option>
                  </a-select>
                </a-col>
                <a-col :span="5">
                  <a-input v-model:value="variable.default_value" placeholder="默认值" />
                </a-col>
                <a-col :span="8">
                  <a-input v-model:value="variable.description" placeholder="描述" />
                </a-col>
                <a-col :span="2">
                  <a-button type="text" danger @click="removeVariable(index)" size="small">
                    <DeleteOutlined />
                  </a-button>
                </a-col>
              </a-row>
            </div>
            <a-button type="dashed" block @click="addVariable" style="margin-top: 16px">
              <PlusOutlined /> 添加变量
            </a-button>
          </div>
        </div>
      </a-form>
    </a-modal>

    <!-- 克隆对话框 -->
    <a-modal :open="cloneDialog.visible" title="克隆流程" :width="dialogWidth" @ok="confirmClone"
      @cancel="() => { cloneDialog.visible = false }" :destroy-on-close="true" class="responsive-modal">
      <a-form :model="cloneDialog.form" layout="vertical">
        <a-form-item label="新流程名称" name="name">
          <a-input v-model:value="cloneDialog.form.name" placeholder="请输入新流程名称" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 详情对话框 -->
    <a-modal :open="detailDialog.visible" title="流程详情" :width="previewDialogWidth" :footer="null"
      @cancel="() => { detailDialog.visible = false }" class="detail-dialog responsive-modal">
      <div v-if="detailDialog.process" class="process-details">
        <div class="detail-header">
          <h2>{{ detailDialog.process.name }}</h2>
          <a-tag
            :color="detailDialog.process.status === 1 ? 'orange' : detailDialog.process.status === 2 ? 'green' : 'default'">
            {{ detailDialog.process.status === 1 ? '草稿' : detailDialog.process.status === 2 ? '已发布' : '已禁用' }}
          </a-tag>
        </div>

        <a-descriptions bordered :column="2">
          <a-descriptions-item label="ID">{{ detailDialog.process.id }}</a-descriptions-item>
          <a-descriptions-item label="版本">v{{ detailDialog.process.version }}</a-descriptions-item>
          <a-descriptions-item label="创建人">{{ detailDialog.process.creator_name }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatFullDateTime(detailDialog.process.created_at)
          }}</a-descriptions-item>
          <a-descriptions-item label="关联表单">{{ getFormName(detailDialog.process.form_design_id) }}</a-descriptions-item>
          <a-descriptions-item label="分类">{{ getCategoryName(detailDialog.process.category_id) }}</a-descriptions-item>
          <a-descriptions-item label="描述" :span="2">{{ detailDialog.process.description || '无描述'
          }}</a-descriptions-item>
        </a-descriptions>

        <div class="process-preview">
          <h3>流程步骤</h3>
          <div class="process-flow-chart">
            <div v-for="(step, index) in parseProcessSteps(detailDialog.process)" :key="index" class="process-node"
              :class="`node-type-${getNodeTypeClass(step.type)}`">
              <div class="node-header">
                <span class="node-type-badge">{{ getNodeTypeName(step.type) }}</span>
                <span class="node-name">{{ step.name }}</span>
              </div>
              <div class="node-content">
                <div class="node-info">
                  <div><strong>角色：</strong>{{ step.roles?.join(', ') || '无' }}</div>
                  <div><strong>动作：</strong>{{ step.actions?.join(', ') || '无' }}</div>
                  <div v-if="step.time_limit"><strong>时间限制：</strong>{{ step.time_limit }}分钟</div>
                  <div v-if="step.auto_assign"><strong>自动分配：</strong>是</div>
                  <div v-if="step.parallel"><strong>并行处理：</strong>是</div>
                </div>
              </div>
              <div class="node-footer" v-if="getNextStepName(step.id, detailDialog.process)">
                <ArrowDownOutlined />
                <div>下一步骤：{{ getNextStepName(step.id, detailDialog.process) }}</div>
              </div>
            </div>
          </div>

          <div v-if="parseProcessConnections(detailDialog.process)?.length" class="connections-section">
            <h3>流程连接</h3>
            <a-table :data-source="parseProcessConnections(detailDialog.process)" :columns="connectionDisplayColumns"
              :pagination="false" size="small">
            </a-table>
          </div>

          <div v-if="parseProcessVariables(detailDialog.process)?.length" class="variables-section">
            <h3>流程变量</h3>
            <a-table :data-source="parseProcessVariables(detailDialog.process)" :columns="variableColumns"
              :pagination="false" size="small">
            </a-table>
          </div>
        </div>

        <div class="detail-footer">
          <a-button @click="detailDialog.visible = false">关闭</a-button>
          <a-button type="primary" @click="handleEditProcess(detailDialog.process)">编辑</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { message, Modal } from 'ant-design-vue';
import {
  PlusOutlined,
  ApartmentOutlined,
  CheckCircleOutlined,
  EditOutlined,
  StopOutlined,
  DeleteOutlined,
  DownOutlined,
  ArrowDownOutlined
} from '@ant-design/icons-vue';

import {
  type ProcessStep,
  type ProcessConnection,
  type ProcessVariable,
  type ProcessDefinition,
  type CreateProcessReq,
  type UpdateProcessReq,
  type DeleteProcessReq,
  type CloneProcessReq,
  type ListProcessReq,
  type DetailProcessReq,
  ProcessStatus,
  StepType,
  listProcess,
  detailProcess,
  createProcess,
  updateProcess,
  deleteProcess,
  cloneProcess
} from '#/api/core/workorder_process';

import { listFormDesign } from '#/api/core/workorder_form_design'
import type { ListFormDesignReq } from '#/api/core/workorder_form_design';

import type { Category } from '#/api/core/workorder_category'
import { listCategory } from '#/api/core/workorder_category'

import { getUserList } from '#/api/core/user'
import type { GetUserListReq } from '#/api/core/user'

// 流程项接口
interface ProcessItem {
  id: number;
  name: string;
  description?: string;
  form_design_id: number;
  category_id?: number;
  status: number;
  version: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

// 流程响应接口
interface ProcessResp extends ProcessItem {
  definition: ProcessDefinition | string;
  category?: {
    name: string;
    description?: string;
  };
}

// 列表响应接口
interface ProcessListResp {
  items: ProcessItem[];
  total: number;
}

// 列定义
const columns = [
  {
    title: '流程名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 200,
    ellipsis: true,
  },
  {
    title: '关联表单',
    dataIndex: 'form_design_id',
    key: 'form_design',
    width: 150,
  },
  {
    title: '分类',
    dataIndex: 'category_id',
    key: 'category',
    width: 120,
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    align: 'center' as const,
  },
  {
    title: '创建人',
    dataIndex: 'creator_name',
    key: 'creator',
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
  },
];

// 用于显示连接的表格列
const connectionDisplayColumns = [
  {
    title: '来源步骤',
    dataIndex: 'from',
    key: 'from',
    customRender: ({ text, record }: any) => {
      return getStepNameById(text, record._process);
    }
  },
  {
    title: '目标步骤',
    dataIndex: 'to',
    key: 'to',
    customRender: ({ text, record }: any) => {
      return getStepNameById(text, record._process);
    }
  },
  { title: '条件', dataIndex: 'condition', key: 'condition' },
  { title: '标签', dataIndex: 'label', key: 'label' },
];

// 变量表格列定义
const variableColumns = [
  { title: '变量名', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '默认值', dataIndex: 'default_value', key: 'default_value' },
  { title: '描述', dataIndex: 'description', key: 'description' },
];

// 状态数据
const loading = ref(false);
const searchQuery = ref('');
const statusFilter = ref<number | null>(null);
const categoryFilter = ref<number | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 统计数据
const stats = reactive({
  total: 0,
  published: 0,
  draft: 0,
  disabled: 0
});

// 数据列表
const processList = ref<ProcessItem[]>([]);
const forms = ref<any[]>([]);
const categories = ref<Category[]>([]);
const roles = ref<string[]>(['admin', 'user', 'manager', 'reviewer']);
const users = ref<any[]>([]);

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

// 流程对话框
const processDialog = reactive({
  visible: false,
  isEdit: false,
  form: {
    id: undefined,
    name: '',
    description: '',
    form_design_id: 0,
    category_id: 0,
    status: ProcessStatus.Draft,
    version: '1.0',
    definition: {
      steps: [],
      connections: [],
      variables: []
    } as ProcessDefinition
  } as CreateProcessReq & { id?: number; status?: number }
});

// 激活的步骤键
const activeStepKeys = ref<string[]>([]);

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入流程名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度应为3到50个字符', trigger: 'blur' }
  ],
  form_design_id: [
    { required: true, message: '请选择关联表单', trigger: 'change' }
  ],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^[\d]+\.[\d]+$/, message: '版本号格式应为：x.x（如：1.0、2.1）', trigger: 'blur' }
  ]
};

// 克隆对话框
const cloneDialog = reactive({
  visible: false,
  form: {
    name: '',
    id: 0
  } as CloneProcessReq
});

// 详情对话框
const detailDialog = reactive({
  visible: false,
  process: null as ProcessResp | null
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

// 表单对话框宽度（更大以容纳编辑器）
const formDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '900px';
  }
  return '900px';
});

// 预览对话框宽度
const previewDialogWidth = computed(() => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 768) return '95%';
    if (width < 1024) return '90%';
    return '80%';
  }
  return '80%';
});

// 表单对话框中的分页分类数据
const processDialogCategories = ref<Category[]>([]);
const categorySelectorLoading = ref(false);
const categorySearchKeyword = ref('');
let categorySearchTimeout: any = null;

// 分类分页状态
const categoryPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 表单对话框中的分页表单数据
const processDialogForms = ref<any[]>([]);
const formSelectorLoading = ref(false);
const formSearchKeyword = ref('');
let formSearchTimeout: any = null;

// 表单分页状态
const formPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 表单对话框中的分页用户数据
const processDialogUsers = ref<any[]>([]);
const userSelectorLoading = ref(false);
const userSearchKeyword = ref('');
let userSearchTimeout: any = null;

// 用户分页状态
const userPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(categoryPagination.total / categoryPagination.pageSize);
});

const formTotalPages = computed(() => {
  return Math.ceil(formPagination.total / formPagination.pageSize);
});

const userTotalPages = computed(() => {
  return Math.ceil(userPagination.total / userPagination.pageSize);
});

// 生成唯一ID
const generateId = () => {
  return 'step_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 解析流程定义JSON字符串
const parseProcessDefinition = (process: any): ProcessDefinition => {
  if (!process) return { steps: [], connections: [], variables: [] };

  if (typeof process.definition === 'string') {
    try {
      return JSON.parse(process.definition);
    } catch (e) {
      console.error('Error parsing process definition:', e);
      return { steps: [], connections: [], variables: [] };
    }
  }

  return process.definition || { steps: [], connections: [], variables: [] };
};

// 解析流程步骤
const parseProcessSteps = (process: any): ProcessStep[] => {
  const definition = parseProcessDefinition(process);
  return definition.steps || [];
};

// 解析流程连接
const parseProcessConnections = (process: any): any[] => {
  const definition = parseProcessDefinition(process);
  return (definition.connections || []).map(conn => ({
    ...conn,
    _process: process // 添加流程引用以便在渲染时获取步骤名称
  }));
};

// 解析流程变量
const parseProcessVariables = (process: any): ProcessVariable[] => {
  const definition = parseProcessDefinition(process);
  return definition.variables || [];
};

// 根据步骤ID获取步骤名称
const getStepNameById = (stepId: string, process: any): string => {
  if (!process || !stepId) return '未知步骤';

  const steps = parseProcessSteps(process);
  const step = steps.find(s => s.id === stepId);
  return step ? step.name : '未知步骤';
};

// 获取下一个步骤的名称
const getNextStepName = (stepId: string, process: any): string => {
  if (!process || !stepId) return '';

  const connections = parseProcessConnections(process);
  const nextConnection = connections.find(conn => conn.from === stepId);

  if (nextConnection) {
    return getStepNameById(nextConnection.to, process);
  }

  return '';
};

// 表格变化处理
const handleTableChange = (pagination: any): void => {
  if (pagination.current !== currentPage.value) {
    currentPage.value = pagination.current;
  }
  if (pagination.pageSize !== pageSize.value) {
    pageSize.value = pagination.pageSize;
    currentPage.value = 1; // 切换页面大小时重置到第一页
  }
  loadProcesses();
};

// 初始化加载数据
const loadProcesses = async () => {
  loading.value = true;
  try {
    const params: ListProcessReq = {
      page: currentPage.value,
      size: pageSize.value,
      name: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      category_id: categoryFilter.value || undefined
    };

    const res = await listProcess(params) as ProcessListResp;
    if (res && res.items) {
      processList.value = res.items || [];
      total.value = res.total || 0;

      // 更新统计数据
      stats.total = res.total || 0;
      stats.published = processList.value.filter((p: ProcessItem) => p.status === ProcessStatus.Published).length;
      stats.draft = processList.value.filter((p: ProcessItem) => p.status === ProcessStatus.Draft).length;
      stats.disabled = processList.value.filter((p: ProcessItem) => p.status === ProcessStatus.Disabled).length;
    }
  } catch (error) {
    message.error('加载流程数据失败');
    console.error('Failed to load processes:', error);
  } finally {
    loading.value = false;
  }
};

// 加载表单列表
const loadForms = async () => {
  try {
    const params: ListFormDesignReq = {
      page: 1,
      size: 100,
    };
    const res = await listFormDesign(params)
    if (res && res.items) {
      forms.value = res.items;
    } else {
      forms.value = [];
    }
  } catch (error: any) {
    console.error('Failed to load forms:', error);
    message.error(`加载表单列表失败: ${error.message || '未知错误'}`);
    forms.value = [];
  }
};

// 方法
const handleSearch = () => {
  currentPage.value = 1;
  loadProcesses();
};

const handleStatusChange = () => {
  currentPage.value = 1;
  loadProcesses();
};

const handleCategoryChange = () => {
  currentPage.value = 1;
  loadProcesses();
};

const handleCreateProcess = () => {
  processDialog.isEdit = false;
  processDialog.form = {
    name: '',
    description: '',
    form_design_id: 0,
    category_id: 0,
    status: ProcessStatus.Draft,
    version: '1.0',
    definition: {
      steps: [
        {
          id: generateId(),
          name: '开始',
          type: StepType.Start,
          roles: [],
          users: [],
          actions: [],
          conditions: [],
          auto_assign: false,
          parallel: false,
          props: {},
          position: { x: 100, y: 100 }
        }
      ],
      connections: [],
      variables: []
    }
  };
  activeStepKeys.value = ['0'];
  processDialog.visible = true;
  resetSelectors();
};

const handleEditProcess = async (row: ProcessItem) => {
  processDialog.isEdit = true;
  loading.value = true;

  try {
    const res = await detailProcess({ id: row.id } as DetailProcessReq) as ProcessResp;
    if (res) {
      const definition = typeof res.definition === 'string'
        ? JSON.parse(res.definition)
        : res.definition;

      processDialog.form = {
        id: res.id,
        name: res.name,
        description: res.description,
        form_design_id: res.form_design_id,
        category_id: res.category_id,
        status: res.status,
        version: res.version,
        definition: definition
      };

      processDialog.visible = true;
      detailDialog.visible = false;
      // 自动展开所有步骤
      activeStepKeys.value = processDialog.form.definition.steps.map((_step: any, index: number) => index.toString());

      await loadSelectorsForEdit(res);
    }
  } catch (error) {
    message.error('获取流程详情失败');
    console.error('Failed to get process details:', error);
  } finally {
    loading.value = false;
  }
};

const handleViewProcess = async (row: ProcessItem) => {
  loading.value = true;

  try {
    const res = await detailProcess({ id: row.id } as DetailProcessReq) as ProcessResp;
    if (res) {
      detailDialog.process = res;
      detailDialog.visible = true;
    }
  } catch (error) {
    message.error('获取流程详情失败');
    console.error('Failed to get process details:', error);
  } finally {
    loading.value = false;
  }
};


const handleCommand = async (command: string, row: ProcessItem) => {
  switch (command) {
    case 'publish':
      await publishProcessHandler(row);
      break;
    case 'unpublish':
      Modal.confirm({
        title: '取消发布',
        content: `确定要取消发布流程 "${row.name}" 吗？这将使该流程无法被新的工单使用。`,
        async onOk() {
          await unpublishProcessHandler(row);
        }
      });
      break;
    case 'validate':
      await validateProcessHandler(row);
      break;
    case 'clone':
      showCloneDialog(row);
      break;
    case 'delete':
      confirmDelete(row);
      break;
  }
};

const publishProcessHandler = async (process: ProcessItem) => {
  loading.value = true;
  try {
    // 首先获取完整的流程详情，确保有完整的definition
    const detail = await detailProcess({ id: process.id });

    const params: UpdateProcessReq = {
      id: process.id,
      name: process.name,
      description: process.description || '',
      form_design_id: process.form_design_id,
      category_id: process.category_id,
      version: process.version,
      status: ProcessStatus.Published,
      definition: typeof detail.definition === 'string'
        ? JSON.parse(detail.definition)
        : detail.definition
    };

    await updateProcess(params);
    message.success(`流程 "${process.name}" 已发布`);
    loadProcesses();
  } catch (error: any) {
    message.error(`发布流程失败: ${error.message || '未知错误'}`);
    console.error('Failed to publish process:', error);
  } finally {
    loading.value = false;
  }
};

const unpublishProcessHandler = async (process: ProcessItem) => {
  loading.value = true;
  try {
    // 首先获取完整的流程详情，确保有完整的definition
    const detail = await detailProcess({ id: process.id });

    const params: UpdateProcessReq = {
      id: process.id,
      name: process.name,
      description: process.description || '',
      form_design_id: process.form_design_id,
      category_id: process.category_id,
      version: process.version,
      status: ProcessStatus.Draft, // 改为草稿状态
      definition: typeof detail.definition === 'string'
        ? JSON.parse(detail.definition)
        : detail.definition
    };

    await updateProcess(params);
    message.success(`流程 "${process.name}" 已取消发布`);
    loadProcesses();
  } catch (error: any) {
    message.error(`取消发布流程失败: ${error.message || '未知错误'}`);
    console.error('Failed to unpublish process:', error);
  } finally {
    loading.value = false;
  }
};

// 流程验证现在通过检查流程定义的结构来实现，不再调用专门的API
const validateProcessHandler = async (process: ProcessItem) => {
  loading.value = true;
  try {
    // 获取流程详情
    const detail = await detailProcess({ id: process.id });
    const definition = typeof detail.definition === 'string'
      ? JSON.parse(detail.definition)
      : detail.definition;

    // 验证流程定义
    const errors = [];

    // 检查是否有起始步骤
    const hasStartStep = definition.steps.some((step: ProcessStep) => step.type === StepType.Start);
    if (!hasStartStep) {
      errors.push('流程缺少起始步骤');
    }

    // 检查是否有结束步骤
    const hasEndStep = definition.steps.some((step: ProcessStep) => step.type === StepType.End);
    if (!hasEndStep) {
      errors.push('流程缺少结束步骤');
    }

    // 检查步骤是否有效
    for (const step of definition.steps) {
      if (!step.name || !step.type) {
        errors.push(`步骤 "${step.name || step.id}" 缺少名称或类型`);
      }

      if (step.type === StepType.Approval && (!step.roles || step.roles.length === 0) && (!step.users || step.users.length === 0)) {
        errors.push(`审批步骤 "${step.name}" 需要至少分配一个角色或用户`);
      }
    }

    // 检查连接是否有效
    for (const connection of definition.connections) {
      if (!connection.from || !connection.to) {
        errors.push('存在不完整的连接');
        continue;
      }

      const fromStep = definition.steps.find((step: ProcessStep) => step.id === connection.from);
      const toStep = definition.steps.find((step: ProcessStep) => step.id === connection.to);

      if (!fromStep) {
        errors.push(`连接的来源步骤 "${connection.from}" 不存在`);
      }

      if (!toStep) {
        errors.push(`连接的目标步骤 "${connection.to}" 不存在`);
      }
    }

    if (errors.length === 0) {
      message.success(`流程 "${process.name}" 验证通过`);
    } else {
      // 使用警告而不是错误，因为这是预期的验证结果
      message.warning({
        content: `流程验证失败：${errors.join(', ')}`,
        duration: 5 // 延长显示时间以便阅读
      });
    }
  } catch (error: any) {
    message.error(`验证流程失败: ${error.message || '未知错误'}`);
    console.error('Failed to validate process:', error);
  } finally {
    loading.value = false;
  }
};

const showCloneDialog = (process: ProcessItem) => {
  cloneDialog.form = {
    id: process.id,
    name: `${process.name} 的副本`
  };
  cloneDialog.visible = true;
};

const confirmClone = async () => {
  try {
    if (!cloneDialog.form.name.trim()) {
      message.error('请输入新流程名称');
      return;
    }

    loading.value = true;
    await cloneProcess(cloneDialog.form);
    message.success(`流程已克隆为 "${cloneDialog.form.name}"`);
    cloneDialog.visible = false;
    loadProcesses();
  } catch (error: any) {
    message.error(`克隆流程失败: ${error.message || '未知错误'}`);
    console.error('Failed to clone process:', error);
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (process: ProcessItem) => {
  Modal.confirm({
    title: '警告',
    content: `确定要删除流程 "${process.name}" 吗？这个操作不可恢复！`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        loading.value = true;
        const params: DeleteProcessReq = {
          id: process.id
        };

        await deleteProcess(params);
        message.success(`流程 "${process.name}" 已删除`);

        // 检查当前页是否还有数据，如果删除后当前页没有数据且不是第一页，则回到上一页
        if (processList.value.length === 1 && currentPage.value > 1) {
          currentPage.value = currentPage.value - 1;
        }

        loadProcesses();
      } catch (error: any) {
        message.error(`删除流程失败: ${error.message || '未知错误'}`);
        console.error('Failed to delete process:', error);
      } finally {
        loading.value = false;
      }
    }
  });
};

// 步骤管理
const addStep = () => {
  const newStep: ProcessStep = {
    id: generateId(),
    name: '',
    type: StepType.Approval,
    roles: [],
    users: [],
    actions: [],
    conditions: [],
    auto_assign: false,
    parallel: false,
    props: {},
    position: { x: 100, y: 100 + processDialog.form.definition.steps.length * 150 }
  };

  processDialog.form.definition.steps.push(newStep);
  activeStepKeys.value.push((processDialog.form.definition.steps.length - 1).toString());
};

const removeStep = (index: number) => {
  processDialog.form.definition.steps.splice(index, 1);
  activeStepKeys.value = activeStepKeys.value.filter(key => key !== index.toString());
};

// 连接管理
const addConnection = () => {
  const newConnection: ProcessConnection = {
    from: '',
    to: '',
    condition: '',
    label: ''
  };

  processDialog.form.definition.connections.push(newConnection);
};

const removeConnection = (index: number) => {
  processDialog.form.definition.connections.splice(index, 1);
};

// 变量管理
const addVariable = () => {
  const newVariable: ProcessVariable = {
    name: '',
    type: 'string',
    default_value: '',
    description: ''
  };

  processDialog.form.definition.variables.push(newVariable);
};

const removeVariable = (index: number) => {
  processDialog.form.definition.variables.splice(index, 1);
};

const saveProcess = async () => {
  try {
    // 表单基础验证
    if (!processDialog.form.name.trim()) {
      message.error('流程名称不能为空');
      return;
    }

    if (!processDialog.form.form_design_id) {
      message.error('请选择关联表单');
      return;
    }

    if (!processDialog.form.version.trim()) {
      message.error('版本号不能为空');
      return;
    }

    // 版本号格式验证
    const versionPattern = /^[\d]+\.[\d]+$/;
    if (!versionPattern.test(processDialog.form.version)) {
      message.error('版本号格式应为：x.x（如：1.0、2.1）');
      return;
    }

    if (processDialog.form.definition.steps.length === 0) {
      message.error('流程至少需要一个步骤');
      return;
    }

    // 步骤验证
    for (let i = 0; i < processDialog.form.definition.steps.length; i++) {
      const step = processDialog.form.definition.steps[i];
      if (!step || !step.name || !step.name.trim()) {
        message.error(`步骤 ${i + 1} 名称不能为空`);
        return;
      }
      if (!step || !step.type) {
        message.error(`步骤 ${i + 1} 类型不能为空`);
        return;
      }

      // 审批类型步骤应有执行角色或用户
      if (step.type === StepType.Approval && step.roles.length === 0 && step.users.length === 0) {
        message.error(`审批步骤 "${step.name}" 需要至少分配一个角色或用户`);
        return;
      }

      // 审批类型应有可执行动作
      if (step.type === StepType.Approval && (!step.actions || step.actions.length === 0)) {
        message.error(`审批步骤 "${step.name}" 需要至少有一个可执行动作`);
        return;
      }
    }

    // 连接验证
    for (let i = 0; i < processDialog.form.definition.connections.length; i++) {
      const connection = processDialog.form.definition.connections[i];
      if (!connection || !connection.from) {
        message.error(`连接 ${i + 1} 的来源步骤不能为空`);
        return;
      }
      if (!connection || !connection.to) {
        message.error(`连接 ${i + 1} 的目标步骤不能为空`);
        return;
      }

      // 确保不存在自我引用
      if (connection.from === connection.to) {
        message.error(`连接 ${i + 1} 不能指向自身`);
        return;
      }
    }

    // 保存前显示加载状态
    loading.value = true;

    if (processDialog.isEdit && processDialog.form.id) {
      const updateData: UpdateProcessReq = {
        id: processDialog.form.id,
        name: processDialog.form.name,
        description: processDialog.form.description || '',
        form_design_id: processDialog.form.form_design_id!,
        definition: processDialog.form.definition,
        category_id: processDialog.form.category_id,
        version: processDialog.form.version!,
        status: processDialog.form.status || ProcessStatus.Draft
      };

      await updateProcess(updateData);
      message.success(`流程 "${processDialog.form.name}" 已更新`);
    } else {
      const createData: CreateProcessReq = {
        name: processDialog.form.name,
        description: processDialog.form.description,
        form_design_id: processDialog.form.form_design_id!,
        definition: processDialog.form.definition,
        category_id: processDialog.form.category_id,
        version: processDialog.form.version
      };

      await createProcess(createData);
      message.success(`流程 "${processDialog.form.name}" 已创建`);

      // 如果是创建新流程，跳转到第一页查看新创建的流程
      currentPage.value = 1;
    }

    processDialog.visible = false;
    loadProcesses();
  } catch (error: any) {
    message.error(processDialog.isEdit
      ? `更新流程失败: ${error.message || '未知错误'}`
      : `创建流程失败: ${error.message || '未知错误'}`
    );
    console.error('Failed to save process:', error);
  } finally {
    loading.value = false;
  }
};

// 辅助方法
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

const getStatusClass = (status: number) => {
  switch (status) {
    case ProcessStatus.Draft: return 'status-draft';
    case ProcessStatus.Published: return 'status-published';
    case ProcessStatus.Disabled: return 'status-disabled';
    default: return '';
  }
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

const getFormName = (formId: number | undefined) => {
  if (!formId) return '未知表单';
  const form = forms.value.find(f => f.id === formId);
  return form ? form.name : '未知表单';
};

const getCategoryName = (categoryId: number | undefined) => {
  if (!categoryId) return '无分类';
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : `分类 ${categoryId}`; // 显示分类ID而不是"无分类"
};

const getNodeTypeClass = (type: string) => {
  const map: Record<string, string> = {
    [StepType.Start]: 'start',
    [StepType.Approval]: 'approval',
    [StepType.Task]: 'task',
    [StepType.Decision]: 'condition',
    [StepType.End]: 'end'
  };
  return map[type] || 'approval';
};

const getNodeTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    [StepType.Start]: '开始',
    [StepType.Approval]: '审批',
    [StepType.Task]: '任务',
    [StepType.Decision]: '决策',
    [StepType.End]: '结束'
  };
  return typeMap[type] || type;
};

// 分页分类加载方法
const loadProcessDialogCategories = async (reset: boolean = false, search?: string): Promise<void> => {
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
        processDialogCategories.value = response.items || [];
        categoryPagination.current = 1;
      } else {
        const existingIds = new Set(processDialogCategories.value.map(cat => cat.id));
        const newItems = (response.items || []).filter((cat: any) => !existingIds.has(cat.id));
        processDialogCategories.value = [...processDialogCategories.value, ...newItems];
      }

      categoryPagination.total = response.total || 0;
      categoryPagination.hasMore = (response.items || []).length === categoryPagination.pageSize &&
        processDialogCategories.value.length < categoryPagination.total;
    }
  } catch (error: any) {
    console.error('加载分类列表失败:', error);
    if (reset) {
      message.error(error.message || '加载分类列表失败');
      processDialogCategories.value = [];
      categoryPagination.current = 1;
      categoryPagination.total = 0;
      categoryPagination.hasMore = false;
    }
  } finally {
    categorySelectorLoading.value = false;
  }
};

// 处理分类搜索
const handleCategorySearch = (value: string): void => {
  categorySearchKeyword.value = value;

  if (categorySearchTimeout) {
    clearTimeout(categorySearchTimeout);
  }

  categorySearchTimeout = setTimeout(() => {
    categoryPagination.current = 1;
    loadProcessDialogCategories(true, value);
  }, 300);
};

// 处理分类下拉框显示/隐藏
const handleCategoryDropdownChange = (open: boolean): void => {
  if (open) {
    if (processDialogCategories.value.length === 0) {
      loadProcessDialogCategories(true);
    }
  }
};

// 处理分类滚动加载更多
const handleCategoryScroll = (e: Event): void => {
  const { target } = e;
  if (!target) return;

  const element = target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = element;

  if (scrollTop + clientHeight >= scrollHeight - 10 &&
    categoryPagination.hasMore &&
    !categorySelectorLoading.value) {
    loadMoreCategories();
  }
};

// 加载更多分类
const loadMoreCategories = async (): Promise<void> => {
  if (!categoryPagination.hasMore || categorySelectorLoading.value) {
    return;
  }

  categoryPagination.current += 1;
  await loadProcessDialogCategories(false);
};

// ==================== 分页表单选择器 ====================

// 分页表单加载方法
const loadProcessDialogForms = async (reset: boolean = false, search?: string): Promise<void> => {
  if (formSelectorLoading.value && !reset) {
    return;
  }

  formSelectorLoading.value = true;

  try {
    const params: ListFormDesignReq = {
      page: reset ? 1 : formPagination.current,
      size: formPagination.pageSize,
      search: search !== undefined ? search : formSearchKeyword.value || undefined
    };

    const response = await listFormDesign(params);

    if (response) {
      if (reset) {
        processDialogForms.value = response.items || [];
        formPagination.current = 1;
      } else {
        const existingIds = new Set(processDialogForms.value.map(form => form.id));
        const newItems = (response.items || []).filter((form: any) => !existingIds.has(form.id));
        processDialogForms.value = [...processDialogForms.value, ...newItems];
      }

      formPagination.total = response.total || 0;
      formPagination.hasMore = (response.items || []).length === formPagination.pageSize &&
        processDialogForms.value.length < formPagination.total;
    }
  } catch (error: any) {
    console.error('加载表单列表失败:', error);
    if (reset) {
      message.error(error.message || '加载表单列表失败');
      processDialogForms.value = [];
      formPagination.current = 1;
      formPagination.total = 0;
      formPagination.hasMore = false;
    }
  } finally {
    formSelectorLoading.value = false;
  }
};

// 处理表单搜索
const handleFormSearch = (value: string): void => {
  formSearchKeyword.value = value;

  if (formSearchTimeout) {
    clearTimeout(formSearchTimeout);
  }

  formSearchTimeout = setTimeout(() => {
    formPagination.current = 1;
    loadProcessDialogForms(true, value);
  }, 300);
};

// 处理表单下拉框显示/隐藏
const handleFormDropdownChange = (open: boolean): void => {
  if (open) {
    if (processDialogForms.value.length === 0) {
      loadProcessDialogForms(true);
    }
  }
};

// 处理表单滚动加载更多
const handleFormScroll = (e: Event): void => {
  const { target } = e;
  if (!target) return;

  const element = target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = element;

  if (scrollTop + clientHeight >= scrollHeight - 10 &&
    formPagination.hasMore &&
    !formSelectorLoading.value) {
    loadMoreForms();
  }
};

// 加载更多表单
const loadMoreForms = async (): Promise<void> => {
  if (!formPagination.hasMore || formSelectorLoading.value) {
    return;
  }

  formPagination.current += 1;
  await loadProcessDialogForms(false);
};

// ==================== 分页用户选择器 ====================

// 分页用户加载方法
const loadProcessDialogUsers = async (reset: boolean = false, search?: string): Promise<void> => {
  if (userSelectorLoading.value && !reset) {
    return;
  }

  userSelectorLoading.value = true;

  try {
    const params: GetUserListReq = {
      page: reset ? 1 : userPagination.current,
      size: userPagination.pageSize,
      search: search !== undefined ? search : userSearchKeyword.value || ''
    };

    const response = await getUserList(params);

    if (response) {
      if (reset) {
        processDialogUsers.value = response.items || [];
        userPagination.current = 1;
      } else {
        const existingIds = new Set(processDialogUsers.value.map(user => user.id));
        const newItems = (response.items || []).filter((user: any) => !existingIds.has(user.id));
        processDialogUsers.value = [...processDialogUsers.value, ...newItems];
      }

      userPagination.total = response.total || 0;
      userPagination.hasMore = (response.items || []).length === userPagination.pageSize &&
        processDialogUsers.value.length < userPagination.total;
    }
  } catch (error: any) {
    console.error('加载用户列表失败:', error);
    if (reset) {
      message.error(error.message || '加载用户列表失败');
      processDialogUsers.value = [];
      userPagination.current = 1;
      userPagination.total = 0;
      userPagination.hasMore = false;
    }
  } finally {
    userSelectorLoading.value = false;
  }
};

// 处理用户搜索
const handleUserSearch = (value: string): void => {
  userSearchKeyword.value = value;

  if (userSearchTimeout) {
    clearTimeout(userSearchTimeout);
  }

  userSearchTimeout = setTimeout(() => {
    userPagination.current = 1;
    loadProcessDialogUsers(true, value);
  }, 300);
};

// 处理用户下拉框显示/隐藏
const handleUserDropdownChange = (open: boolean): void => {
  if (open) {
    if (processDialogUsers.value.length === 0) {
      loadProcessDialogUsers(true);
    }
  }
};

// 处理用户滚动加载更多
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

// 加载更多用户
const loadMoreUsers = async (): Promise<void> => {
  if (!userPagination.hasMore || userSelectorLoading.value) {
    return;
  }

  userPagination.current += 1;
  await loadProcessDialogUsers(false);
};

// ==================== 重置和初始化方法 ====================

// 重置所有选择器状态
const resetSelectors = (): void => {
  resetCategorySelector();
  resetFormSelector();
  resetUserSelector();
};

// 重置分类选择器状态
const resetCategorySelector = (): void => {
  processDialogCategories.value = [];
  categoryPagination.current = 1;
  categoryPagination.total = 0;
  categoryPagination.hasMore = false;
  categorySearchKeyword.value = '';
  categorySelectorLoading.value = false;

  if (categorySearchTimeout) {
    clearTimeout(categorySearchTimeout);
    categorySearchTimeout = null;
  }
};

// 重置表单选择器状态
const resetFormSelector = (): void => {
  processDialogForms.value = [];
  formPagination.current = 1;
  formPagination.total = 0;
  formPagination.hasMore = false;
  formSearchKeyword.value = '';
  formSelectorLoading.value = false;

  if (formSearchTimeout) {
    clearTimeout(formSearchTimeout);
    formSearchTimeout = null;
  }
};

// 重置用户选择器状态
const resetUserSelector = (): void => {
  processDialogUsers.value = [];
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
const loadSelectorsForEdit = async (processData: ProcessResp): Promise<void> => {
  resetSelectors();

  try {
    // 优先加载分类和表单数据，确保即使出错也能显示当前选中的值
    // 并行加载所有选择器数据
    await Promise.all([
      loadCategoryForEdit(processData),
      loadFormForEdit(processData),
      loadUserForEdit(processData)
    ]);
  } catch (error) {
    console.error('加载编辑模式选择器信息失败:', error);
  }
};

// 为编辑模式加载分类信息
const loadCategoryForEdit = async (processData: ProcessResp): Promise<void> => {
  try {
    // 先检查全局分类列表中是否有此分类
    const existingCategory = categories.value.find(cat => cat.id === processData.category_id);

    // 如果全局分类中有，优先添加到选择器列表中确保能立即显示
    if (processData.category_id && existingCategory) {
      processDialogCategories.value = [existingCategory];
    }

    // 再加载更多分类
    await loadProcessDialogCategories(true);

    // 如果加载完后还是没找到当前分类，创建一个占位项
    if (processData.category_id && !processDialogCategories.value.find(cat => cat.id === processData.category_id)) {
      if (processData.category) {
        const categoryInfo: Category = {
          id: processData.category_id,
          name: processData.category?.name || `分类${processData.category_id}`,
          description: processData.category?.description || '',
          icon: '',
          sort_order: 0,
          status: 1,
          parent_id: null
        };

        // 确保选中的分类在列表最前面
        processDialogCategories.value = [categoryInfo, ...processDialogCategories.value.filter(c => c.id !== categoryInfo.id)];
      } else {
        // 如果没有分类详情，创建一个基本项
        const categoryInfo: Category = {
          id: processData.category_id,
          name: `分类 ${processData.category_id}`,
          description: '',
          icon: '',
          sort_order: 0,
          status: 1,
          parent_id: null
        };

        // 确保选中的分类在列表最前面
        processDialogCategories.value = [categoryInfo, ...processDialogCategories.value.filter(c => c.id !== categoryInfo.id)];
      }
    }
  } catch (error) {
    console.error('加载编辑模式分类信息失败:', error);
    if (processData.category_id) {
      // 出错时也要确保至少有当前分类可选
      const categoryInfo: Category = {
        id: processData.category_id,
        name: `分类 ${processData.category_id}`,
        description: '',
        icon: '',
        sort_order: 0,
        status: 1,
        parent_id: null
      };
      processDialogCategories.value = [categoryInfo];
    }
  }
};

// 为编辑模式加载表单信息
const loadFormForEdit = async (processData: ProcessResp): Promise<void> => {
  try {
    // 先检查全局表单列表中是否有此表单
    const globalForm = forms.value.find(form => form.id === processData.form_design_id);

    // 如果全局表单中有，优先添加到选择器列表中确保能立即显示
    if (processData.form_design_id && globalForm) {
      processDialogForms.value = [globalForm];
    }

    // 再加载更多表单
    await loadProcessDialogForms(true);

    // 如果加载完后还是没找到当前表单，创建一个占位项
    if (processData.form_design_id && !processDialogForms.value.find(form => form.id === processData.form_design_id)) {
      // 创建一个占位表单项
      const formInfo = {
        id: processData.form_design_id,
        name: `表单 ${processData.form_design_id}`,
        description: ''
      };
      // 确保选中的表单在列表最前面
      processDialogForms.value = [formInfo, ...processDialogForms.value.filter(f => f.id !== formInfo.id)];
    }
  } catch (error) {
    console.error('加载编辑模式表单信息失败:', error);
    if (processData.form_design_id) {
      // 出错时也要确保至少有当前表单可选
      const formInfo = {
        id: processData.form_design_id,
        name: `表单 ${processData.form_design_id}`,
        description: ''
      };
      processDialogForms.value = [formInfo];
    }
  }
};

// 为编辑模式加载用户信息
const loadUserForEdit = async (processData: ProcessResp): Promise<void> => {
  try {
    await loadProcessDialogUsers(true);

    // 检查流程定义中的用户ID，确保它们在选择器中可用
    const definition = parseProcessDefinition(processData);
    const allUserIds = new Set<number>();

    definition.steps?.forEach(step => {
      step.users?.forEach(userId => {
        if (typeof userId === 'number') {
          allUserIds.add(userId);
        }
      });
    });

    // 检查缺失的用户并添加到列表中
    const missingUserIds = Array.from(allUserIds).filter(userId =>
      !processDialogUsers.value.find(user => user.id === userId)
    );

    if (missingUserIds.length > 0) {
      // 从全局users中查找缺失的用户
      const missingUsers = missingUserIds.map(userId => {
        const globalUser = users.value.find(user => user.id === userId);
        return globalUser || {
          id: userId,
          username: `用户${userId}`,
          real_name: ''
        };
      });

      processDialogUsers.value = [...missingUsers, ...processDialogUsers.value];
    }
  } catch (error) {
    console.error('加载编辑模式用户信息失败:', error);
  }
};

// 初始化加载
onMounted(async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadForms(),
      loadProcessDialogCategories(),
      loadProcessDialogUsers(),
      loadProcesses()
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
.process-management-container {
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
  width: 250px;
  min-width: 200px;
}

.status-filter {
  width: 120px;
  min-width: 100px;
}

.category-filter {
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

.process-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.process-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-draft {
  background-color: #faad14;
}

.status-published {
  background-color: #52c41a;
}

.status-disabled {
  background-color: #d9d9d9;
}

.process-name-text {
  font-weight: 500;
  word-break: break-all;
}

.description-text {
  color: #606266;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.creator-name {
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
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 步骤编辑器 */
.steps-editor {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-step-button {
  text-align: center;
  margin-top: 16px;
}

/* 连接和变量编辑器 */
.connections-editor,
.variables-editor {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
}

.connection-item,
.variable-item {
  margin-bottom: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.connection-item:last-child,
.variable-item:last-child {
  margin-bottom: 0;
}

/* 详情对话框 */
.detail-dialog .process-details {
  margin-bottom: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.detail-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
  word-break: break-all;
}

.process-preview {
  margin-top: 24px;
}

.process-preview h3 {
  margin: 24px 0 16px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.process-flow-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.process-node {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  transition: all 0.3s ease;
  position: relative;
}

.process-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.node-type-start {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-color: #91d5ff;
}

.node-type-approval {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
  border-color: #b7eb8f;
}

.node-type-task {
  background: linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%);
  border-color: #ffe58f;
}

.node-type-condition {
  background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);
  border-color: #ffcc02;
}

.node-type-end {
  background: linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%);
  border-color: #d3adf7;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.node-type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-color: #1890ff;
}

.node-type-start .node-type-badge {
  background-color: #1890ff;
}

.node-type-approval .node-type-badge {
  background-color: #52c41a;
}

.node-type-task .node-type-badge {
  background-color: #faad14;
}

.node-type-condition .node-type-badge {
  background-color: #fa8c16;
}

.node-type-end .node-type-badge {
  background-color: #722ed1;
}

.node-name {
  font-weight: 600;
  font-size: 16px;
  color: #262626;
}

.node-content {
  margin-bottom: 12px;
}

.node-info {
  font-size: 14px;
  line-height: 1.6;
}

.node-info div {
  margin-bottom: 4px;
  color: #595959;
}

.node-info strong {
  color: #262626;
  font-weight: 500;
}

.node-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #d9d9d9;
  color: #8c8c8c;
  font-size: 13px;
}

.connections-section,
.variables-section {
  margin-top: 24px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.detail-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

/* 下拉框宽度修复 */
.select-step {
  width: 100% !important;
  min-width: 180px;
}

/* 通用选择器样式 */
.selector-loading,
.selector-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  color: #8c8c8c;
  font-size: 14px;
}

/* 分类选择器样式 */
.category-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-weight: 500;
  color: #262626;
}

.category-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* 表单选择器样式 */
.form-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-name {
  font-weight: 500;
  color: #262626;
}

.form-desc {
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* 用户选择器样式 */
.user-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
  color: #262626;
}

.user-real-name {
  font-size: 12px;
  color: #8c8c8c;
}

/* 加载更多按钮样式 */
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

/* 对话框响应式优化 */
.responsive-modal :deep(.ant-modal) {
  max-width: calc(100vw - 16px);
  margin: 8px;
}

/* 流程设计模态框样式 */
.process-design-modal :deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .process-management-container {
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
  .category-filter {
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
    gap: 4px;
  }

  .action-buttons .ant-btn {
    padding: 0 4px;
    font-size: 12px;
  }

  .detail-footer {
    justify-content: center;
  }

  .detail-footer .ant-btn {
    flex: 1;
    max-width: 120px;
  }

  .responsive-modal :deep(.ant-modal-body) {
    padding: 16px;
    max-height: calc(100vh - 160px);
    overflow-y: auto;
  }

  .category-desc,
  .form-desc {
    max-width: 150px;
  }

  .load-more-content {
    padding: 6px 8px;
  }
}

/* 平板端适配 */
@media (max-width: 1024px) and (min-width: 769px) {
  .process-management-container {
    padding: 16px;
  }

  .search-input {
    width: 200px;
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

  .creator-info {
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .creator-name {
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

  .category-desc,
  .form-desc {
    max-width: 120px;
  }

  .load-more-content {
    padding: 4px 6px;
    font-size: 12px;
  }

  .user-option {
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>
