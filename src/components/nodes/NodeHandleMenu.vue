<template>
  <!-- Right handle with expandable menu | 右侧连接点带展开菜单 -->
  <div class="handle-menu-anchor">
    <!-- Vue Flow handle for edge connections - visible and draggable | 可见且可拖拽的 Vue Flow 连接点 -->
    <Handle type="source" :position="Position.Right" id="right" style="width: 12px; height: 12px;" />

    <!-- Hover zone with + icon | 带 + 图标的悬浮区域 -->
    <div v-if="visible && showHandleHoverZone" class="handle-hover-zone" @mouseenter="showMenu = true" @mouseleave="showMenu = false">
      <n-icon :size="14" class="add-icon">
        <AddOutline />
      </n-icon>
      <transition name="menu-fade">
        <div v-if="showMenu" class="handle-menu" @mousedown.stop>
          <button v-for="item in menuItems" :key="item.type" @click.stop="handleCreate(item)" class="menu-item group">
            <n-icon :size="14" class="text-gray-500 group-hover:text-white">
              <component :is="item.icon" />
            </n-icon>
            <span class="menu-label">{{ item.label }}</span>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon } from 'naive-ui'
import { ImageOutline, VideocamOutline, ChatbubbleOutline, DocumentTextOutline, GitNetworkOutline, AddOutline } from '@vicons/ionicons5'
import { addNode, addEdge, nodes } from '../../stores/canvas'

const props = defineProps({
  nodeId: { type: String, required: true },
  nodeType: { type: String, required: true },
  visible: { type: Boolean },
  dotColor: { type: String, default: 'var(--accent-color)' },
  operations: { type: Array, default: null } // 传空数组则不显示 handle-hover-zone
})

const { updateNodeInternals, connection } = useVueFlow()
const showMenu = ref(false)

// Handle click to start connection | 点击开始连线
const handleStartConnection = () => {
  // Set connection to start a new edge from this node
  // This will show the connecting line that follows the mouse
  connection.value = {
    source: props.nodeId,
    sourceHandle: 'right'
  }
  showMenu.value = false
}

// Define connectable targets per node type | 定义每种节点类型可连接的目标
const MENU_CONFIG = {
  text: [
    { type: 'imageConfig', label: '生图', icon: ImageOutline },
    { type: 'videoConfig', label: '生视频', icon: VideocamOutline },
    { type: 'llmConfig', label: 'LLM', icon: ChatbubbleOutline }
  ],
  image: [
    { type: 'imageConfig', label: '图生图', icon: ImageOutline },
    { type: 'videoConfig', label: '生视频', icon: VideocamOutline }
  ],
  imageConfig: [
    { type: 'imageConfig', label: '图生图', icon: ImageOutline }
  ],
  llmConfig: [
    { type: 'imageConfig', label: '生图', icon: ImageOutline },
    { type: 'videoConfig', label: '生视频', icon: VideocamOutline },
    { type: 'text', label: '文本', icon: DocumentTextOutline }
  ],
  videoConfig: [],
  video: [
    { type: 'videoConfig', label: '生视频', icon: VideocamOutline }
  ]
}

const menuItems = computed(() => {
  // If operations prop is provided (including empty array), use it; otherwise fall back to MENU_CONFIG
  if (props.operations !== null) {
    return props.operations
  }
  return MENU_CONFIG[props.nodeType] || []
})

// Whether to show handle-hover-zone | 是否显示 handle-hover-zone
const showHandleHoverZone = computed(() => {
  return props.operations !== null ? props.operations.length > 0 : (MENU_CONFIG[props.nodeType] || []).length > 0
})

const handleCreate = (item) => {
  const currentNode = nodes.value.find(n => n.id === props.nodeId)
  const x = (currentNode?.position?.x || 0) + 400
  const y = (currentNode?.position?.y || 0)

  const defaultData = {
    imageConfig: { model: 'doubao-seedream-4-5-251128', size: '2048x2048', label: '文生图' },
    videoConfig: { label: '视频生成' },
    llmConfig: { label: 'LLM文本生成' },
    text: { content: '', label: '文本输入' }
  }

  const newId = addNode(item.type, { x, y }, defaultData[item.type] || {})

  addEdge({
    source: props.nodeId,
    target: newId,
    sourceHandle: 'right',
    targetHandle: 'left'
  })

  setTimeout(() => updateNodeInternals(newId), 50)
  showMenu.value = false
  window.$message?.success(`已创建${item.label}节点`)
}
</script>

<style scoped>
/* Anchor sits at the right edge center of the parent node | 锚点在父节点右边缘中心 */
.handle-menu-anchor {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(50%, -50%);
  z-index: 100;
}

/* Hover zone - hidden by default, show on anchor hover | 默认隐藏，锚点 hover 时显示 */
.handle-hover-zone {
  position: absolute;
  left: 50%;
  top: -30px;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  background: var(--bg-tertiary, #2a2a3e);
  border: 1px solid var(--border-color, #444);
  opacity: 1;
  transition: all 0.2s ease;
}

/* Show hover zone when anchor is hovered | 锚点 hover 时显示悬浮区域 */
.handle-menu-anchor:hover .handle-hover-zone {
  opacity: 1;
  pointer-events: auto;
}

.handle-hover-zone:hover {
  background: var(--accent-color, #8b5cf6);
  border-color: var(--accent-color, #8b5cf6);
  transform: translate(-50%, -50%) scale(1.1);
}

/* Add icon | 添加图标 */
.add-icon {
  color: var(--text-secondary, #999);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  transition: color 0.2s ease;
}

.handle-hover-zone:hover .add-icon {
  color: white;
}

/* Visible dot | 可见圆点 */
.handle-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.handle-dot.is-active {
  width: 14px;
  height: 14px;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
}

/* Menu floats to the right of the dot | 菜单浮在圆点右侧 */
.handle-menu {
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px;
  background: var(--bg-secondary, #1e1e2e);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary, #999);
  transition: all 0.15s ease;
  cursor: pointer;
  border: none;
  background: none;
}

.menu-item:hover {
  background: var(--accent-color, #8b5cf6);
  color: white;
}

.menu-label {
  font-size: 11px;
}

/* Menu divider | 菜单分隔线 */
.menu-divider {
  height: 1px;
  background: var(--border-color, #333);
  margin: 4px 0;
}

/* Animation | 动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
