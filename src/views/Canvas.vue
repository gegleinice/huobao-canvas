<template>
  <div class="h-screen w-screen flex flex-col bg-[var(--bg-primary)]">
    <AppHeader>
      <template #left>
        <button 
          @click="goBack"
          class="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-all duration-300 ease-smooth"
        >
          <n-icon :size="16"><ChevronBackOutline /></n-icon>
        </button>
        <n-dropdown :options="projectOptions" @select="handleProjectAction">
          <button class="flex items-center gap-1 hover:bg-[var(--bg-tertiary)] px-2.5 py-1.5 rounded-xl transition-all duration-300 ease-smooth">
            <span class="font-medium text-sm text-[var(--text-primary)]">{{ projectName }}</span>
            <n-icon :size="12" class="text-[var(--text-muted)]"><ChevronDownOutline /></n-icon>
          </button>
        </n-dropdown>
      </template>
      <template #right>
        <button 
          @click="showDownloadModal = true"
          class="p-2 hover:bg-[var(--bg-tertiary)] rounded-xl transition-all duration-300 ease-smooth"
          :class="hasDownloadableAssets ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)]'"
          title="批量下载"
        >
          <n-icon :size="16"><DownloadOutline /></n-icon>
        </button>
        <button 
          @click="showApiSettings = true"
          class="p-2 hover:bg-[var(--bg-tertiary)] rounded-xl transition-all duration-300 ease-smooth"
          :class="isApiConfigured ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)]'"
          title="API 设置"
        >
          <n-icon :size="16"><SettingsOutline /></n-icon>
        </button>
      </template>
    </AppHeader>

    <!-- Main canvas area | 主画布区域 -->
    <div class="flex-1 relative overflow-hidden">
      <!-- Vue Flow canvas | Vue Flow 画布 -->
      <VueFlow
        :key="flowKey"
        v-model:nodes="nodes"
        v-model:edges="edges"
        v-model:viewport="viewport"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :default-viewport="canvasViewport"
        :default-edge-options="defaultEdgeOptions"
        :connection-line-options="connectionLineOptions"
        :min-zoom="0.1"
        :max-zoom="2"
        :snap-to-grid="true"
        :snap-grid="[20, 20]"
        @connect="onConnect"
        @connect-start="onConnectStart"
        @connect-end="onConnectEnd"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
        @viewport-change="handleViewportChange"
        @edges-change="onEdgesChange"
        class="canvas-flow"
      >
        <Background
          v-if="showGrid"
          variant="dots"
          :gap="22"
          :size="1.2"
          pattern-color="rgba(255,255,255,0.07)"
        />
        <MiniMap 
          v-if="!isMobile"
          position="bottom-right"
          :pannable="true"
          :zoomable="true"
        />
      </VueFlow>

      <!-- Center hint — only on empty canvas | 空画布时才显示 -->
      <div
        v-if="showEmptyCanvasHint"
        class="pointer-events-none absolute left-1/2 top-[18%] z-[5] -translate-x-1/2 select-none"
        aria-hidden="true"
      >
        <div
          class="pointer-events-auto flex items-center gap-2 rounded-full border border-white/[0.1] bg-[rgba(16,16,16,0.78)] px-4 py-2 shadow-lg backdrop-blur-xl"
        >
          <span class="text-[11px] font-medium tracking-wide text-white/50">
            双击空白加一块 · 拖线停一会或松手可选块
          </span>
        </div>
      </div>

      <!-- Double-click add-node palette | 双击添加节点面板 -->
      <Teleport to="body">
        <div
          v-if="dblClickPalette.open"
          class="canvas-palette-layer fixed inset-0 z-[100] bg-transparent pointer-events-none"
        >
          <div
            class="nodrag nopan canvas-dbl-palette pointer-events-auto absolute z-[101] w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/[0.1] bg-[rgba(28,28,28,0.94)] py-2 shadow-2xl backdrop-blur-2xl"
            :style="dblClickPaletteStyle"
            @click.stop
          >
            <p class="px-3 pb-1.5 text-[10px] font-medium tracking-wider text-white/40">
              {{ palettePanelTitle }}
            </p>
            <button
              v-for="opt in paletteNodeOptions"
              :key="opt.type"
              type="button"
              class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-white/[0.06]"
              @click="addNodeFromDblPalette(opt.type)"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]"
              >
                <n-icon :size="18" :color="opt.color"><component :is="opt.icon" /></n-icon>
              </span>
              <span class="text-sm text-white/88">{{ opt.name }}</span>
            </button>
          </div>
        </div>
      </Teleport>

      <!-- Left toolbar -->
      <aside class="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 p-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-[var(--card-shadow)] z-10">
        <button 
          @click="showNodeMenu = !showNodeMenu"
          class="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--accent-color)] text-[#050505] hover:bg-[var(--accent-hover)] transition-all duration-300 ease-smooth active:scale-95"
          title="添加节点"
        >
          <n-icon :size="16"><AddOutline /></n-icon>
        </button>
        <button 
          @click="showWorkflowPanel = true"
          class="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-300 ease-smooth"
          title="模板"
        >
          <n-icon :size="16"><AppsOutline /></n-icon>
        </button>
        <div class="w-full h-px bg-[var(--border-subtle)] my-0.5"></div>
        <button 
          v-for="tool in tools" 
          :key="tool.id"
          @click="tool.action"
          :disabled="tool.disabled && tool.disabled()"
          class="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-300 ease-smooth disabled:opacity-15 disabled:cursor-not-allowed"
          :title="tool.name"
        >
          <n-icon :size="16"><component :is="tool.icon" /></n-icon>
        </button>
      </aside>

      <!-- Node menu popup -->
      <div 
        v-if="showNodeMenu"
        class="absolute left-20 top-1/2 -translate-y-1/2 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-[var(--card-shadow-hover)] p-1 z-20 min-w-[160px]"
      >
        <button 
          v-for="nodeType in paletteNodeOptions" 
          :key="nodeType.type"
          @click="addNewNode(nodeType.type)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all duration-200 text-left"
        >
          <n-icon :size="16" :color="nodeType.color"><component :is="nodeType.icon" /></n-icon>
          <span class="text-sm text-[var(--text-primary)]">{{ nodeType.name }}</span>
        </button>
      </div>

      <!-- Bottom zoom controls -->
      <div class="absolute bottom-4 left-4 flex items-center gap-0.5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] shadow-[var(--card-shadow)] p-0.5">
        <button 
          @click="fitView({ padding: 0.2 })" 
          class="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all duration-200"
          title="适应视图"
        >
          <n-icon :size="13"><LocateOutline /></n-icon>
        </button>
        <div class="flex items-center gap-0.5 px-1">
          <button @click="zoomOut" class="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all duration-200">
            <n-icon :size="12"><RemoveOutline /></n-icon>
          </button>
          <span class="text-[11px] font-mono min-w-[36px] text-center text-[var(--text-muted)]">{{ Math.round(viewport.zoom * 100) }}%</span>
          <button @click="zoomIn" class="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all duration-200">
            <n-icon :size="12"><AddOutline /></n-icon>
          </button>
        </div>
      </div>

      <!-- Bottom input panel（抬高 z-index，避免被画布内高层叠节点挡住点击） -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-[200] pointer-events-auto">
        <!-- Processing indicator -->
        <div 
          v-if="isProcessing" 
          class="mb-3 p-3.5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--accent-color)]/20 shadow-[var(--card-shadow)]"
        >
          <div class="flex items-center gap-2 text-sm text-[var(--accent-color)] mb-2">
            <n-spin :size="14" />
            <span class="font-medium text-xs tracking-wide">处理中…</span>
          </div>
          <div v-if="currentResponse" class="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
            {{ currentResponse }}
          </div>
        </div>

        <div class="p-[1px] rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.04)] to-transparent">
          <div class="p-1.5 bg-[var(--bg-secondary)] rounded-2xl shadow-[var(--card-shadow)]">
            <div class="bg-[var(--bg-primary)] rounded-[10px] p-3">
              <textarea
                v-model="chatInput"
                :placeholder="inputPlaceholder"
                :disabled="isProcessing"
                class="w-full bg-transparent resize-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-h-[32px] max-h-[100px] text-sm disabled:opacity-50"
                rows="1"
                @keydown.enter.exact="handleEnterKey"
                @keydown.enter.ctrl="sendMessage"
              />
              <div class="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-subtle)]">
                <div class="flex items-center gap-2">
                  <button 
                    @click="handlePolish"
                    :disabled="isProcessing || !chatInput.trim()"
                    class="px-3 py-1.5 text-[11px] font-medium tracking-wide rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-300 ease-smooth disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    润色
                  </button>
                  <button 
                    @click="handleReflectEvolve"
                    :disabled="isProcessing || !reflectTargetNode"
                    class="px-3 py-1.5 text-[11px] font-medium tracking-wide rounded-full border border-white/[0.1] bg-white/[0.04] text-[var(--text-muted)] hover:border-[var(--accent-color)]/35 hover:text-[var(--accent-color)] transition-all duration-300 ease-smooth disabled:opacity-30 disabled:cursor-not-allowed"
                    title="结合后面接着的块，重写选中里的字"
                  >
                    推敲
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <label class="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <n-switch v-model:value="autoExecute" size="small" />
                    连放
                  </label>
                  <button 
                    @click="sendMessage"
                    :disabled="isProcessing"
                    class="w-8 h-8 rounded-xl bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] flex items-center justify-center transition-all duration-300 ease-smooth active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <n-spin v-if="isProcessing" :size="12" />
                    <n-icon v-else :size="14" color="#050505"><SendOutline /></n-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tags -->
        <div class="flex flex-wrap items-center justify-center gap-2 mt-2.5">
          <button 
            v-for="tag in suggestions" 
            :key="tag"
            @click="chatInput = tag"
            class="px-2.5 py-1 text-[11px] tracking-wide rounded-full border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] transition-all duration-300 ease-smooth"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <!-- API Settings Modal | API 设置弹窗 -->
    <ApiSettings v-model:show="showApiSettings" />

    <!-- Rename Modal | 重命名弹窗 -->
    <n-modal v-model:show="showRenameModal" preset="dialog" title="重命名项目">
      <n-input v-model:value="renameValue" placeholder="请输入项目名称" />
      <template #action>
        <n-button @click="showRenameModal = false">取消</n-button>
        <n-button type="primary" @click="confirmRename">确定</n-button>
      </template>
    </n-modal>

    <!-- Delete Confirm Modal | 删除确认弹窗 -->
    <n-modal v-model:show="showDeleteModal" preset="dialog" title="删除项目" type="warning">
      <p>确定要删除项目「{{ projectName }}」吗？此操作不可恢复。</p>
      <template #action>
        <n-button @click="showDeleteModal = false">取消</n-button>
        <n-button type="error" @click="confirmDelete">删除</n-button>
      </template>
    </n-modal>

    <!-- Download Modal | 下载弹窗 -->
    <DownloadModal v-model:show="showDownloadModal" />

    <!-- Workflow Panel | 工作流面板 -->
    <WorkflowPanel v-model:show="showWorkflowPanel" @add-workflow="handleAddWorkflow" />
  </div>
</template>

<script setup>
/**
 * Canvas view component | 画布视图组件
 * Main infinite canvas with Vue Flow integration
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { VueFlow, useVueFlow, ConnectionLineType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { NIcon, NSwitch, NDropdown, NSpin, NModal, NInput, NButton, useMessage } from 'naive-ui'
import { 
  ChevronBackOutline,
  ChevronDownOutline,
  SettingsOutline,
  AddOutline,
  ImageOutline,
  SendOutline,
  RefreshOutline,
  TextOutline,
  VideocamOutline,
  ColorPaletteOutline,
  BookmarkOutline,
  ArrowUndoOutline,
  ArrowRedoOutline,
  GridOutline,
  LocateOutline,
  RemoveOutline,
  DownloadOutline,
  AppsOutline,
  ChatbubbleOutline
} from '@vicons/ionicons5'
import { nodes, edges, addNode, addNodes, addEdge, addEdges, updateNode, initSampleData, loadProject, saveProject, clearCanvas, canvasViewport, updateViewport, undo, redo, canUndo, canRedo, manualSaveHistory, startBatchOperation, endBatchOperation } from '../stores/canvas'
import { loadAllModels } from '../stores/models'
import { useChat, useWorkflowOrchestrator } from '../hooks'
import { useModelStore } from '../stores/pinia'
import { projects, initProjectsStore, updateProject, renameProject, currentProject } from '../stores/projects'

// API Settings component | API 设置组件
import ApiSettings from '../components/ApiSettings.vue'
import DownloadModal from '../components/DownloadModal.vue'
import WorkflowPanel from '../components/WorkflowPanel.vue'
import AppHeader from '../components/AppHeader.vue'

// API Config state | API 配置状态
const modelStore = useModelStore()
const isApiConfigured = computed(() => !!modelStore.currentApiKey)

const message = useMessage()

// Initialize models on page load | 页面加载时初始化模型
onMounted(() => {
  loadAllModels()
})

// Chat templates | 问答模板
const CHAT_TEMPLATES = {
  imagePrompt: {
    name: '生图提示词',
    systemPrompt: '你是一个专业的AI绘画提示词专家。将用户输入的内容美化成高质量的生图提示词，包含风格、光线、構图、细节等要素。直接返回提示词，不要其他解释。',
    model: 'gpt-4o-mini'
  },
  videoPrompt: {
    name: '视频提示词',
    systemPrompt: '你是一个专业的AI视频提示词专家。将用户输入的内容美化成高质量的视频生成提示词，包含运动、场景、镜头等要素。直接返回提示词，不要其他解释。',
    model: 'gpt-4o-mini'
  }
}

// Current template | 当前模板
const currentTemplate = ref('imagePrompt')

// Chat hook with image prompt template | 问答 hook
const { 
  loading: chatLoading, 
  status: chatStatus, 
  currentResponse, 
  send: sendChat 
} = useChat({
  systemPrompt: CHAT_TEMPLATES.imagePrompt.systemPrompt,
  model: CHAT_TEMPLATES.imagePrompt.model
})

// Self-reflect / evolve selected node prompt | 选中节点的反思进化（独立会话，避免污染润色上下文）
const REFLECT_SYSTEM_PROMPT =
  '你是画布上的「推敲」顾问。用户会提供当前文案或说明，以及后面接着的块的简要上下文。\n' +
  '任务：\n' +
  '1. 内省：这段话和后接的块是否对得上、缺什么；\n' +
  '2. 改写：输出一版更利落、更贴后面能力的正文。\n' +
  '只输出进化后的正文，不要标题、引号或解释段落。'

const {
  send: sendReflect,
  clear: clearReflectChat
} = useChat({
  systemPrompt: REFLECT_SYSTEM_PROMPT,
  model: CHAT_TEMPLATES.imagePrompt.model
})

// Workflow orchestrator hook | 工作流编排 hook
const {
  isAnalyzing: workflowAnalyzing,
  isExecuting: workflowExecuting,
  currentStep: workflowStep,
  totalSteps: workflowTotalSteps,
  executionLog: workflowLog,
  analyzeIntent,
  executeWorkflow,
  createTextToImageWorkflow,
  createMultiAngleStoryboard,
  WORKFLOW_TYPES
} = useWorkflowOrchestrator()

// Custom node components | 自定义节点组件
import TextNode from '../components/nodes/TextNode.vue'
import ImageConfigNode from '../components/nodes/ImageConfigNode.vue'
import VideoNode from '../components/nodes/VideoNode.vue'
import ImageNode from '../components/nodes/ImageNode.vue'
import VideoConfigNode from '../components/nodes/VideoConfigNode.vue'
import LLMConfigNode from '../components/nodes/LLMConfigNode.vue'
import ImageRoleEdge from '../components/edges/ImageRoleEdge.vue'
import PromptOrderEdge from '../components/edges/PromptOrderEdge.vue'
import ImageOrderEdge from '../components/edges/ImageOrderEdge.vue'

const router = useRouter()
const route = useRoute()

// Vue Flow instance | Vue Flow 实例
const {
  viewport,
  zoomIn,
  zoomOut,
  fitView,
  updateNodeInternals,
  project,
  connectionStartHandle
} = useVueFlow()

// Default edge + connection line — smooth curves | 默认边与拖拽连线样式
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: {
    stroke: 'rgba(210, 210, 220, 0.38)',
    strokeWidth: 1.75
  }
}

const connectionLineOptions = {
  type: ConnectionLineType.SmoothStep,
  style: {
    stroke: 'rgba(200, 168, 85, 0.45)',
    strokeWidth: 2
  }
}

// Register custom node types | 注册自定义节点类型
const nodeTypes = {
  text: markRaw(TextNode),
  imageConfig: markRaw(ImageConfigNode),
  video: markRaw(VideoNode),
  image: markRaw(ImageNode),
  videoConfig: markRaw(VideoConfigNode),
  llmConfig: markRaw(LLMConfigNode)
}

// Register custom edge types | 注册自定义边类型
const edgeTypes = {
  imageRole: markRaw(ImageRoleEdge),
  promptOrder: markRaw(PromptOrderEdge),
  imageOrder: markRaw(ImageOrderEdge)
}

// UI state | UI状态
const showNodeMenu = ref(false)
const chatInput = ref('')
const autoExecute = ref(false)
const isMobile = ref(false)
const showGrid = ref(true)
const showApiSettings = ref(false)
const isProcessing = ref(false)

// Flow key for forcing re-render on project switch | 项目切换时强制重新渲染的 key
const flowKey = ref(Date.now())

// Modal state | 弹窗状态
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const showDownloadModal = ref(false)
const showWorkflowPanel = ref(false)
const renameValue = ref('')

// Check if has downloadable assets | 检查是否有可下载素材
const hasDownloadableAssets = computed(() => {
  return nodes.value.some(n => 
    (n.type === 'image' || n.type === 'video') && n.data?.url
  )
})


// Project info | 项目信息
const projectName = computed(() => {
  const project = projects.value.find(p => p.id === route.params.id)
  return project?.name || '未命名项目'
})

// Project dropdown options | 项目下拉选项
const projectOptions = [
  { label: '重命名', key: 'rename' },
  { label: '复制', key: 'duplicate' },
  { label: '删除', key: 'delete' }
]

// Unified node palette — Tap-style short names | 节点类型（左栏 / 双击 / 拖线落地共用）
const paletteNodeOptions = [
  { type: 'text', name: '文字', icon: TextOutline, color: '#93c5fd' },
  { type: 'image', name: '画面', icon: ImageOutline, color: '#c4b5fd' },
  { type: 'video', name: '成片', icon: VideocamOutline, color: '#fca5a5' },
  { type: 'imageConfig', name: '出图', icon: ColorPaletteOutline, color: '#86efac' },
  { type: 'videoConfig', name: '影像', icon: VideocamOutline, color: '#fcd34d' },
  { type: 'llmConfig', name: '长文', icon: ChatbubbleOutline, color: '#d8b4fe' }
]

// Toolbar tools | 工具栏工具
const tools = [
  { id: 'text', name: '文字', icon: TextOutline, action: () => addNewNode('text') },
  { id: 'image', name: '画面', icon: ImageOutline, action: () => addNewNode('image') },
  { id: 'imageConfig', name: '出图', icon: ColorPaletteOutline, action: () => addNewNode('imageConfig') },
  { id: 'videoConfig', name: '影像', icon: VideocamOutline, action: () => addNewNode('videoConfig') },
  { id: 'undo', name: '撤销', icon: ArrowUndoOutline, action: () => undo(), disabled: () => !canUndo() },
  { id: 'redo', name: '重做', icon: ArrowRedoOutline, action: () => redo(), disabled: () => !canRedo() }
]

const showEmptyCanvasHint = computed(() => nodes.value.length === 0)

// Double-click / wire-drop palette | 双击与拖线松手共用面板
const dblClickPalette = ref({
  open: false,
  screenX: 0,
  screenY: 0,
  flowX: 0,
  flowY: 0,
  wireFrom: null
})

const palettePanelTitle = computed(() =>
  dblClickPalette.value.wireFrom ? '接到这里' : '加一块'
)

/** 记录从哪个点拉出的线（松在空白处时用来接新节点） */
let connectionDragOrigin = null

let paneLastClickAt = 0
let paneLastFlowX = 0
let paneLastFlowY = 0
const DOUBLE_TAP_MS = 380
const DOUBLE_TAP_FLOW_DIST = 48

const dblClickPaletteStyle = computed(() => {
  const w = 280
  const h = 320
  const x = Math.min(Math.max(12, dblClickPalette.value.screenX - w / 2), window.innerWidth - w - 12)
  const y = Math.min(Math.max(12, dblClickPalette.value.screenY - 8), window.innerHeight - h - 12)
  return { left: `${x}px`, top: `${y}px` }
})

const closeDblClickPalette = () => {
  dblClickPalette.value.open = false
  dblClickPalette.value.wireFrom = null
}

const openDblClickPalette = (screenX, screenY, flow, wireFrom = null) => {
  dblClickPalette.value = {
    open: true,
    screenX,
    screenY,
    flowX: flow.x,
    flowY: flow.y,
    wireFrom
  }
  showNodeMenu.value = false
}

/** 拖线静止一段时间后弹出选块（与松手逻辑共用面板） */
const CONNECT_PAUSE_MS = 420
let connectPauseTimer = null
const lastConnectPointer = { x: 0, y: 0 }

const clearConnectPauseTimer = () => {
  if (connectPauseTimer != null) {
    clearTimeout(connectPauseTimer)
    connectPauseTimer = null
  }
}

const armConnectPauseTimer = (fallbackNodeId, fallbackHandleId) => {
  if (!fallbackNodeId && !connectionStartHandle.value) return
  connectPauseTimer = window.setTimeout(() => {
    connectPauseTimer = null
    const h = connectionStartHandle.value
    const nodeId = h?.nodeId || fallbackNodeId
    if (!nodeId) return
    const handleId = (h?.id != null && h.id !== '') ? h.id : (fallbackHandleId || 'right')
    const wireFrom = { source: nodeId, sourceHandle: handleId }
    const flow = project({ x: lastConnectPointer.x, y: lastConnectPointer.y })
    openDblClickPalette(lastConnectPointer.x, lastConnectPointer.y, flow, wireFrom)
  }, CONNECT_PAUSE_MS)
}

const onPointerMoveWhileConnecting = (e) => {
  lastConnectPointer.x = e.clientX
  lastConnectPointer.y = e.clientY
  clearConnectPauseTimer()
  if (dblClickPalette.value.open && dblClickPalette.value.wireFrom) {
    closeDblClickPalette()
  }
  if (!connectionStartHandle.value) return
  armConnectPauseTimer()
}

watch(connectionStartHandle, (handle) => {
  clearConnectPauseTimer()
  if (handle) {
    window.addEventListener('pointermove', onPointerMoveWhileConnecting, { passive: true })
  } else {
    window.removeEventListener('pointermove', onPointerMoveWhileConnecting)
  }
})

const addNodeFromDblPalette = (type) => {
  const { flowX, flowY, wireFrom } = { ...dblClickPalette.value }
  closeDblClickPalette()
  const nodeId = addNewNodeAt(type, { x: flowX, y: flowY })
  if (wireFrom && nodeId) {
    nextTick(() => {
      commitEdgeFromConnection({
        source: wireFrom.source,
        target: nodeId,
        sourceHandle: wireFrom.sourceHandle || 'right',
        targetHandle: 'left'
      })
      updateNodeInternals(nodeId)
    })
  }
}

/** Summarize downstream nodes for reflect | 下游上下文摘要 */
const buildDownstreamSummary = (sourceId) => {
  const outs = edges.value.filter(e => e.source === sourceId)
  if (!outs.length) return '（当前无出线连接，仅根据文案本身进化）'
  const lines = []
  for (const e of outs) {
    const t = nodes.value.find(n => n.id === e.target)
    if (!t) continue
    const label = t.data?.label || t.type
    if (t.type === 'imageConfig') {
      lines.push(`→ 出图「${label}」${t.data?.model || '—'} · ${t.data?.size || '—'}`)
    } else if (t.type === 'videoConfig') {
      lines.push(`→ 影像「${label}」${t.data?.ratio || '—'} · ${t.data?.duration ?? '—'}s`)
    } else if (t.type === 'image' && t.data?.url) {
      lines.push(`→ 画面「${label}」已有图`)
    } else if (t.type === 'video' && t.data?.url) {
      lines.push(`→ 成片「${label}」已就绪`)
    } else if (t.type === 'llmConfig') {
      lines.push(`→ 长文「${label}」`)
    } else {
      lines.push(`→ ${t.type}「${label}」`)
    }
  }
  return lines.join('\n')
}

/** First selected node that can evolve | 可选中并参与反思的节点 */
const reflectTargetNode = computed(() => {
  const sel = nodes.value.filter(n => n.selected)
  return sel.find(n => n.type === 'text' || n.type === 'llmConfig') || null
})

// Input placeholder | 输入占位符
const inputPlaceholder = '写一句想法，回车丢到画布上'

// Quick suggestions | 快捷建议
const suggestions = [
  '像个魔法森林',
  '三只不同的小猫',
  '生成多角度分镜',
  '夏日田野环绕漫步'
]

// Add new node at flow coordinates (centered on point) | 在指定流坐标添加节点
const addNewNodeAt = (type, flowPoint) => {
  const nodeId = addNode(type, {
    x: flowPoint.x - 100,
    y: flowPoint.y - 70
  })
  const maxZIndex = Math.max(0, ...nodes.value.map(n => n.zIndex || 0))
  updateNode(nodeId, { zIndex: maxZIndex + 1 })
  setTimeout(() => updateNodeInternals(nodeId), 50)
  showNodeMenu.value = false
  return nodeId
}

// Add new node | 添加新节点（视口中心）
const addNewNode = (type) => {
  const viewportCenterX = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const viewportCenterY = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom
  addNewNodeAt(type, { x: viewportCenterX, y: viewportCenterY })
}

// Handle add workflow from panel | 处理从面板添加工作流
const handleAddWorkflow = ({ workflow, options }) => {
  // Calculate viewport center position | 计算视口中心位置
  const viewportCenterX = -viewport.value.x / viewport.value.zoom + (window.innerWidth / 2) / viewport.value.zoom
  const viewportCenterY = -viewport.value.y / viewport.value.zoom + (window.innerHeight / 2) / viewport.value.zoom

  // Create nodes from workflow template | 从工作流模板创建节点
  const startPosition = { x: viewportCenterX - 300, y: viewportCenterY - 200 }
  const { nodes: newNodes, edges: newEdges } = workflow.createNodes(startPosition, options)

  // Start batch operation manually | 手动开始批量操作
  startBatchOperation()

  // Add nodes to canvas in batch | 批量将节点添加到画布
  const nodeSpecs = newNodes.map(node => ({
    type: node.type,
    position: node.position,
    data: node.data
  }))
  const nodeIds = addNodes(nodeSpecs, false)

  // Map old node IDs to new IDs | 映射旧节点ID到新ID
  const idMap = {}
  newNodes.forEach((node, index) => {
    idMap[node.id] = nodeIds[index]
  })

  // Add edges to canvas in batch | 批量将边添加到画布
  const edgeSpecs = newEdges.map(edge => ({
    source: idMap[edge.source] || edge.source,
    target: idMap[edge.target] || edge.target,
    sourceHandle: edge.sourceHandle || 'right',
    targetHandle: edge.targetHandle || 'left',
    type: edge.type,
    data: edge.data
  }))

  // Add edges (autoBatch=false to use manual batch) | 添加边（autoBatch=false 以使用手动批量）
  addEdges(edgeSpecs, false)

  // End batch operation and save to history | 结束批量操作并保存到历史
  endBatchOperation()

  // Delay node internals update | 延迟节点内部更新
  setTimeout(() => {
    // Update node internals | 更新节点内部
    nodeIds.forEach(nodeId => {
      updateNodeInternals(nodeId)
    })
  }, 100)

  message.success(`已添加工作流: ${workflow.name}`)
}

/** Create edge with correct type (also used after wire-drop new node) | 创建边（含类型分支） */
const commitEdgeFromConnection = (params) => {
  const sourceNode = nodes.value.find(n => n.id === params.source)
  const targetNode = nodes.value.find(n => n.id === params.target)

  if (sourceNode?.type === 'image' && targetNode?.type === 'videoConfig') {
    addEdge({
      ...params,
      type: 'imageRole',
      data: { imageRole: 'first_frame_image' }
    })
  } else if (sourceNode?.type === 'text' && targetNode?.type === 'imageConfig') {
    const existingTextEdges = edges.value.filter(e =>
      e.target === params.target && e.type === 'promptOrder'
    )
    const nextOrder = existingTextEdges.length + 1
    addEdge({
      ...params,
      type: 'promptOrder',
      data: { promptOrder: nextOrder }
    })
  } else if (sourceNode?.type === 'image' && targetNode?.type === 'imageConfig') {
    const existingImageEdges = edges.value.filter(e =>
      e.target === params.target && e.type === 'imageOrder'
    )
    let mentionedImageCount = 0
    const connectedTextEdges = edges.value.filter(e => e.target === params.target)
    for (const edge of connectedTextEdges) {
      const sn = nodes.value.find(n => n.id === edge.source)
      if (sn?.type === 'text') {
        const content = sn.data?.content || ''
        const mentionRegex = /@\[([^\]|]+)(?:\|([^\]]+))?\]/g
        let match
        while ((match = mentionRegex.exec(content)) !== null) {
          const mentionedNode = nodes.value.find(n => n.id === match[1])
          if (mentionedNode?.type === 'image') mentionedImageCount++
        }
      }
    }
    const nextOrder = existingImageEdges.length + mentionedImageCount + 1
    addEdge({
      ...params,
      type: 'imageOrder',
      data: { imageOrder: nextOrder }
    })
  } else if (sourceNode?.type === 'llmConfig' && targetNode?.type === 'imageConfig') {
    const existingTextEdges = edges.value.filter(e =>
      e.target === params.target && e.type === 'promptOrder'
    )
    const nextOrder = existingTextEdges.length + 1
    addEdge({
      ...params,
      type: 'promptOrder',
      data: { promptOrder: nextOrder }
    })
  } else if (sourceNode?.type === 'llmConfig' && targetNode?.type === 'videoConfig') {
    addEdge({
      ...params,
      type: 'promptOrder',
      data: { promptOrder: 1 }
    })
  } else {
    addEdge(params)
  }
}

const onConnectStart = (payload) => {
  if (payload?.nodeId) {
    connectionDragOrigin = {
      source: payload.nodeId,
      sourceHandle: payload.handleId || 'right'
    }
  } else {
    connectionDragOrigin = null
  }
  const ev = payload?.event
  if (ev) {
    const cx = ev.clientX ?? ev.touches?.[0]?.clientX
    const cy = ev.clientY ?? ev.touches?.[0]?.clientY
    if (cx != null && cy != null) {
      lastConnectPointer.x = cx
      lastConnectPointer.y = cy
      clearConnectPauseTimer()
      nextTick(() => armConnectPauseTimer(payload.nodeId, payload.handleId))
    }
  }
}

const onConnect = (params) => {
  connectionDragOrigin = null
  clearConnectPauseTimer()
  commitEdgeFromConnection(params)
}

/** 线没挂上合法接口时：松手弹出选块面板 | 拖线落在空白处 */
const onConnectEnd = (event) => {
  const origin = connectionDragOrigin
  connectionDragOrigin = null
  clearConnectPauseTimer()
  if (dblClickPalette.value.open) return
  if (!origin) return
  const cx = event?.clientX ?? event?.changedTouches?.[0]?.clientX
  const cy = event?.clientY ?? event?.changedTouches?.[0]?.clientY
  if (cx == null || cy == null) return
  const flow = project({ x: cx, y: cy })
  openDblClickPalette(cx, cy, flow, {
    source: origin.source,
    sourceHandle: origin.sourceHandle
  })
}
const onNodeClick = (event) => {
  // nodes.value.forEach(node => {
  //   updateNode(node.id, { selected: false })
  // })
  
  // // Select clicked node | 选中的节点
  // const clickedNode = nodes.value.find(n => n.id === event.node.id)
  // if (clickedNode) {
  //   updateNode(event.node.id, { selected: true })
  // }
}

// Handle viewport change | 处理视口变化
const handleViewportChange = (newViewport) => {
  updateViewport(newViewport)
}

// Handle edges change | 处理边变化
const onEdgesChange = (changes) => {
  // Check if any edge is being removed | 检查是否有边被删除
  const hasRemoval = changes.some(change => change.type === 'remove')
  
  if (hasRemoval) {
    // Trigger history save after edge removal | 边删除后触发历史保存
    nextTick(() => {
      manualSaveHistory()
    })
  }
}

// Handle pane click | 处理画布点击（含双击打开添加面板）
const onPaneClick = (event) => {
  const flow = project({ x: event.clientX, y: event.clientY })
  const now = Date.now()
  const dt = now - paneLastClickAt
  const dist = Math.hypot(flow.x - paneLastFlowX, flow.y - paneLastFlowY)
  if (dt < DOUBLE_TAP_MS && dist < DOUBLE_TAP_FLOW_DIST) {
    paneLastClickAt = 0
    openDblClickPalette(event.clientX, event.clientY, flow)
    return
  }
  paneLastClickAt = now
  paneLastFlowX = flow.x
  paneLastFlowY = flow.y
  showNodeMenu.value = false
  closeDblClickPalette()
}

// Handle project action | 处理项目操作
const handleProjectAction = (key) => {
  switch (key) {
    case 'rename':
      renameValue.value = projectName.value
      showRenameModal.value = true
      break
    case 'duplicate':
      // TODO: Implement duplicate
      message.info('复制功能开发中')
      break
    case 'delete':
      showDeleteModal.value = true
      break
  }
}

// Confirm rename | 确认重命名
const confirmRename = () => {
  const projectId = route.params.id
  if (renameValue.value.trim()) {
    renameProject(projectId, renameValue.value.trim())
    message.success('已重命名')
  }
  showRenameModal.value = false
}

// Confirm delete | 确认删除
const confirmDelete = () => {
  const projectId = route.params.id
  // deleteProject(projectId) // TODO: import deleteProject
  showDeleteModal.value = false
  message.success('项目已删除')
  router.push('/')
}

// Handle Enter key | 处理回车键
const handleEnterKey = (e) => {
  e.preventDefault()
  sendMessage()
}

// Reflect / evolve selected text or LLM node | 反思进化选中节点
const handleReflectEvolve = async () => {
  const node = reflectTargetNode.value
  if (!node) {
    message.warning('先选中一块「文字」或「长文」')
    return
  }
  if (!isApiConfigured.value) {
    message.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  let body = ''
  if (node.type === 'text') body = (node.data?.content || '').trim()
  if (node.type === 'llmConfig') body = (node.data?.systemPrompt || '').trim()

  if (!body) {
    message.warning('节点内暂无可用文案')
    return
  }

  isProcessing.value = true
  try {
    clearReflectChat()
    const ctx = buildDownstreamSummary(node.id)
    const payload = `【当前内容】\n${body}\n\n【下游上下文】\n${ctx}`
    const result = await sendReflect(payload, true)
    if (result) {
      if (node.type === 'text') {
        updateNode(node.id, { content: result })
      } else {
        updateNode(node.id, { systemPrompt: result })
      }
      setTimeout(() => updateNodeInternals(node.id), 30)
      message.success('已推敲一版')
    }
  } catch (err) {
    message.error(err.message || '推敲失败')
  } finally {
    isProcessing.value = false
  }
}

// Handle AI polish | 处理 AI 润色
const handlePolish = async () => {
  const input = chatInput.value.trim()
  if (!input) return
  
  // Check API configuration | 检查 API 配置
  if (!isApiConfigured.value) {
    message.warning('请先配置 API Key')
    showApiSettings.value = true
    return
  }

  isProcessing.value = true
  const originalInput = chatInput.value

  try {
    // Call chat API to polish the prompt | 调用 AI 润色提示词
    const result = await sendChat(input, true)
    
    if (result) {
      chatInput.value = result
      message.success('已润色')
    }
  } catch (err) {
    chatInput.value = originalInput
    message.error(err.message || '润色失败')
  } finally {
    isProcessing.value = false
  }
}

// Send message | 发送消息
const sendMessage = async () => {
  const input = chatInput.value.trim()
  if (!input) return

  // 连放模式需要 API；手动模式仅本地加节点，可不配置
  if (autoExecute.value && !isApiConfigured.value) {
    message.warning('开启「连放」需要先配置 API Key')
    showApiSettings.value = true
    return
  }

  isProcessing.value = true
  const content = chatInput.value
  chatInput.value = ''

  try {
    // Calculate position to avoid overlap | 计算位置避免重叠
    let maxY = 0
    if (nodes.value.length > 0) {
      maxY = Math.max(...nodes.value.map(n => n.position.y))
    }
    const baseX = 100
    const baseY = maxY + 200

    if (autoExecute.value) {
      // Auto-execute mode: analyze intent and execute workflow | 自动执行模式：分析意图并执行工作流
      message.info('正在分析工作流...')
      
      try {
        // Analyze user intent | 分析用户意图
        const result = await analyzeIntent(content)
        
        // Ensure we have valid workflow params | 确保有效的工作流参数
        const workflowParams = {
          workflow_type: result?.workflow_type || WORKFLOW_TYPES.TEXT_TO_IMAGE,
          image_prompt: result?.image_prompt || content,
          video_prompt: result?.video_prompt || content,
          character: result?.character,
          shots: result?.shots
        }
        
        message.info(`执行: ${result?.description || '出图'}`)
        
        // Execute the workflow | 执行工作流
        await executeWorkflow(workflowParams, { x: baseX, y: baseY })
        
        message.success('工作流已启动')
      } catch (err) {
        console.error('Workflow error:', err)
        // Fallback to simple text-to-image | 回退到文生图
        message.warning('改用默认出图流')
        await createTextToImageWorkflow(content, { x: baseX, y: baseY })
      }
    } else {
      // Manual mode: just create nodes | 手动模式：仅创建节点
      const textNodeId = addNode('text', { x: baseX, y: baseY }, { 
        content: content, 
        label: '一句' 
      })
      
      const imageConfigNodeId = addNode('imageConfig', { x: baseX + 400, y: baseY }, {
        label: '出图'
      })
      
      addEdge({
        source: textNodeId,
        target: imageConfigNodeId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })
    }
  } catch (err) {
    message.error(err.message || '创建失败')
  } finally {
    isProcessing.value = false
  }
}

// Go back to home | 返回首页
const goBack = () => {
  router.push('/')
}

// Check if mobile | 检测是否移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Load project by ID | 根据ID加载项目
const loadProjectById = (projectId) => {
  // Update flow key to force VueFlow re-render | 更新 key 强制 VueFlow 重新渲染
  flowKey.value = Date.now()
  
  if (projectId && projectId !== 'new') {
    loadProject(projectId)
  } else {
    // New project - clear canvas | 新项目 - 清空画布
    clearCanvas()
  }
}

// Watch for route changes | 监听路由变化
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      // Save current project before switching | 切换前保存当前项目
      if (oldId) {
        saveProject()
      }
      // Load new project | 加载新项目
      loadProjectById(newId)
    }
  }
)

const onGlobalKeydown = (e) => {
  if (e.key === 'Escape') {
    closeDblClickPalette()
    showNodeMenu.value = false
  }
}

// Initialize | 初始化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', onGlobalKeydown)
  
  // Initialize projects store | 初始化项目存储
  initProjectsStore()
  
  // Load project data | 加载项目数据
  loadProjectById(route.params.id)
  
  // Check for initial prompt from home page | 检查来自首页的初始提示词
  const initialPrompt = sessionStorage.getItem('ai-canvas-initial-prompt')
  if (initialPrompt) {
    sessionStorage.removeItem('ai-canvas-initial-prompt')
    chatInput.value = initialPrompt
    // Auto-send the message | 自动发送消息
    nextTick(() => {
      sendMessage()
    })
  }
})

// Cleanup on unmount | 卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('pointermove', onPointerMoveWhileConnecting)
  clearConnectPauseTimer()
  // Save project before leaving | 离开前保存项目
  saveProject()
})
</script>

<style>
/* Import Vue Flow styles | 引入 Vue Flow 样式 */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/minimap/dist/style.css';

.canvas-flow {
  width: 100%;
  height: 100%;
}
</style>
