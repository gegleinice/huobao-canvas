<template>
  <!-- LLM Config node wrapper | LLM配置节点包裹层 -->
  <div class="llm-node-wrapper" @mouseenter="showHandleMenu = true" @mouseleave="showHandleMenu = false">
    <!-- LLM Config node | LLM配置节点 -->
    <div
      class="llm-node bg-[var(--bg-secondary)] rounded-xl border min-w-[320px] max-w-[400px] relative transition-all duration-200"
      :class="data.selected ? 'border-1 border-purple-500 shadow-lg shadow-purple-500/20' : 'border border-[var(--border-color)]'">
      <!-- Header | 头部 -->
      <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-gradient-to-r from-purple-500/10 to-transparent">
        <div class="flex items-center gap-2">
          <n-icon :size="16" class="text-purple-500">
            <ChatbubbleOutline />
          </n-icon>
          <span class="text-sm font-medium text-[var(--text-secondary)]">{{ data.label || 'LLM 文本生成' }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button @click="handleDuplicate" class="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors" title="复制节点">
            <n-icon :size="14">
              <CopyOutline />
            </n-icon>
          </button>
          <button @click="handleDelete" class="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors" title="删除节点">
            <n-icon :size="14">
              <TrashOutline />
            </n-icon>
          </button>
        </div>
      </div>

      <!-- Config content | 配置内容 -->
      <div class="p-3 space-y-3">
        <!-- System prompt | 系统提示词 -->
        <div>
          <label class="text-xs text-[var(--text-secondary)] mb-1 block">系统提示词</label>
          <textarea 
            v-model="systemPrompt" 
            @blur="updateConfig"
            @wheel.stop 
            @mousedown.stop
            class="w-full bg-[var(--bg-tertiary)] rounded-lg p-2 resize-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] min-h-[60px] max-h-[120px] overflow-y-auto border border-[var(--border-color)] focus:border-purple-500 transition-colors"
            placeholder="设定 AI 的角色和行为规则..." 
          />
        </div>

        <!-- Model selection | 模型选择 -->
        <div>
          <label class="text-xs text-[var(--text-secondary)] mb-1 block">模型</label>
          <n-select
            v-model:value="model"
            :options="modelOptions"
            size="small"
            @update:value="updateConfig"
          />
        </div>

        <!-- Output format | 输出格式 -->
        <div>
          <label class="text-xs text-[var(--text-secondary)] mb-1 block">输出格式</label>
          <n-select
            v-model:value="outputFormat"
            :options="formatOptions"
            size="small"
            @update:value="updateConfig"
          />
        </div>

        <!-- Generate button | 生成按钮 -->
        <button 
          @click="handleGenerate"
          :disabled="isGenerating"
          class="w-full px-4 py-2 text-sm rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <n-spin v-if="isGenerating" :size="14" />
          <n-icon v-else :size="14"><SparklesOutline /></n-icon>
          {{ isGenerating ? '生成中...' : '执行生成' }}
        </button>

        <!-- Output preview | 输出预览 -->
        <div v-if="outputContent" class="mt-2">
          <div class="flex items-center justify-between mb-1">
            <label class="text-xs text-[var(--text-secondary)]">生成结果</label>
            <button 
              @click="handleCopyOutput"
              class="text-xs text-[var(--text-secondary)] hover:text-purple-500 flex items-center gap-1 transition-colors"
            >
              <n-icon :size="12"><CopyOutline /></n-icon>
              复制
            </button>
          </div>
          <div 
            @wheel.stop 
            @mousedown.stop
            class="bg-[var(--bg-tertiary)] rounded-lg p-2 text-xs text-[var(--text-primary)] max-h-[150px] overflow-y-auto border border-[var(--border-color)]"
          >
            <pre class="whitespace-pre-wrap">{{ outputContent }}</pre>
          </div>

          <!-- Split actions | 拆分操作 -->
          <div class="mt-2 flex gap-2">
            <button
              @click="handleSplitToTextWithImage"
              :disabled="isSplitting"
              class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-purple-400 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <n-spin v-if="isSplitting" :size="12" />
              <n-icon v-else :size="12"><ImageOutline /></n-icon>
              {{ isSplitting ? '拆分中...' : '拆分图文' }}
            </button>
            <button
              @click="handleSplitToTextOnly"
              :disabled="isSplitting"
              class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-purple-400 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <n-spin v-if="isSplitting" :size="12" />
              <n-icon v-else :size="12"><ListOutline /></n-icon>
              {{ isSplitting ? '拆分中...' : '拆分文本' }}
            </button>
          </div>
          <div v-if="splitMessage" class="mt-1 text-xs text-green-600 dark:text-green-400">{{ splitMessage }}</div>
        </div>
      </div>

      <!-- Handles | 连接点 -->
      <Handle type="target" :position="Position.Left" id="left" class="!bg-purple-500" />
      <NodeHandleMenu :nodeId="id" nodeType="llmConfig" dotColor="#a855f7" :visible="showHandleMenu" />
    </div>
  </div>
</template>

<script setup>
/**
 * LLM Config node component | LLM配置节点组件
 * For text generation tasks like story segmentation
 */
import { ref, watch, computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NIcon, NSpin, NSelect } from 'naive-ui'
import { TrashOutline, CopyOutline, ChatbubbleOutline, SparklesOutline, ListOutline, ImageOutline } from '@vicons/ionicons5'
import { updateNode, removeNode, duplicateNode, addNodes, addEdges, nodes, edges, startBatchOperation, endBatchOperation } from '../../stores/canvas'
import NodeHandleMenu from './NodeHandleMenu.vue'
import { useChat, useApiConfig } from '../../hooks'

const props = defineProps({
  id: String,
  data: Object
})

// Vue Flow instance | Vue Flow 实例
const { updateNodeInternals } = useVueFlow()

// API config hook | API 配置 hook
const { isConfigured: isApiConfigured } = useApiConfig()

// Local state | 本地状态
const showHandleMenu = ref(false)
const systemPrompt = ref(props.data?.systemPrompt || '')
const model = ref(props.data?.model || 'gpt-4o-mini')
const outputFormat = ref(props.data?.outputFormat || 'text')
const outputContent = ref(props.data?.outputContent || '')
const isGenerating = ref(false)
const isSplitting = ref(false)
const splitMessage = ref('')

// Model options | 模型选项
const modelOptions = [
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
  { label: 'DeepSeek V3', value: 'deepseek-chat' }
]

// Format options | 格式选项
const formatOptions = [
  { label: '纯文本', value: 'text' },
  { label: 'JSON 结构', value: 'json' },
  { label: 'Markdown', value: 'markdown' }
]

// Chat hook | Chat hook
const chatHook = computed(() => {
  return useChat({
    systemPrompt: systemPrompt.value,
    model: model.value
  })
})

// Watch for external data changes | 监听外部数据变化
watch(() => props.data, (newData) => {
  if (newData?.systemPrompt !== undefined) systemPrompt.value = newData.systemPrompt
  if (newData?.model !== undefined) model.value = newData.model
  if (newData?.outputFormat !== undefined) outputFormat.value = newData.outputFormat
  if (newData?.outputContent !== undefined) outputContent.value = newData.outputContent
}, { deep: true })

// Update config in store | 更新存储中的配置
const updateConfig = () => {
  updateNode(props.id, { 
    systemPrompt: systemPrompt.value,
    model: model.value,
    outputFormat: outputFormat.value,
    outputContent: outputContent.value
  })
}

// Get input from connected nodes | 获取连接节点的输入
const getInputFromConnections = () => {
  const incomingEdges = edges.value.filter(e => e.target === props.id)
  const inputs = []
  
  for (const edge of incomingEdges) {
    const sourceNode = nodes.value.find(n => n.id === edge.source)
    if (sourceNode) {
      if (sourceNode.type === 'text' && sourceNode.data?.content) {
        inputs.push(sourceNode.data.content)
      } else if (sourceNode.type === 'llmConfig' && sourceNode.data?.outputContent) {
        inputs.push(sourceNode.data.outputContent)
      }
    }
  }
  
  return inputs.join('\n\n')
}

// Handle generate | 处理生成
const handleGenerate = async () => {
  if (!isApiConfigured.value) {
    window.$message?.warning('请先配置 API Key')
    return
  }

  const input = getInputFromConnections()
  if (!input && !systemPrompt.value) {
    window.$message?.warning('请连接输入节点或设置系统提示词')
    return
  }

  isGenerating.value = true

  try {
    const { send } = useChat({
      systemPrompt: systemPrompt.value,
      model: model.value
    })

    const result = await send(input || '请根据系统提示词生成内容', true)
    
    if (result) {
      outputContent.value = result
      updateNode(props.id, { outputContent: result, executed: true })
      window.$message?.success('生成完成')
    }
  } catch (err) {
    updateNode(props.id, { error: err.message || '生成失败' })
    window.$message?.error(err.message || '生成失败')
  } finally {
    isGenerating.value = false
  }
}

// Watch for auto-execute flag | 监听自动执行标志
watch(
  () => props.data?.autoExecute,
  (shouldExecute) => {
    if (shouldExecute && !isGenerating.value) {
      updateNode(props.id, { autoExecute: false })
      setTimeout(() => handleGenerate(), 100)
    }
  },
  { immediate: true }
)

// Handle delete | 处理删除
const handleDelete = () => {
  removeNode(props.id)
}

// Handle duplicate | 处理复制
const handleDuplicate = () => {
  const newNodeId = duplicateNode(props.id)
  window.$message?.success('节点已复制')
  if (newNodeId) {
    setTimeout(() => {
      updateNodeInternals(newNodeId)
    }, 50)
  }
}

// Handle copy output | 处理复制输出
const handleCopyOutput = async () => {
  if (!outputContent.value) return
  try {
    await navigator.clipboard.writeText(outputContent.value)
    window.$message?.success('已复制到剪贴板')
  } catch (err) {
    window.$message?.error('复制失败')
  }
}

/**
 * Parse text into paragraphs
 * 解析文本为段落 - 连续的非空行合并为一个段落，空行作为分隔符
 */
const parseParagraphs = (text) => {
  const lines = text.split('\n')
  const paragraphs = []
  let current = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '') {
      // Empty line - separator
      if (current.trim()) {
        paragraphs.push(current.trim())
        current = ''
      }
    } else {
      // Non-empty line - append to current paragraph
      current += (current ? '\n' : '') + line
    }
  }

  // Don't forget the last paragraph
  if (current.trim()) {
    paragraphs.push(current.trim())
  }

  return paragraphs
}

/**
 * Split output by newline into text + image nodes
 * 按换行拆分为文本节点 + 图片配置节点
 */
const handleSplitToTextWithImage = () => {
  if (!outputContent.value) return
  // Split by paragraphs (continuous non-empty lines as one segment)
  const segments = parseParagraphs(outputContent.value)

  if (segments.length === 0) {
    window.$message?.warning('内容为空，无法拆分')
    return
  }

  isSplitting.value = true
  splitMessage.value = ''

  try {
    // Get current node position
    const currentNode = nodes.value.find(n => n.id === props.id)
    const baseX = (currentNode?.position?.x || 0) + 450
    const baseY = (currentNode?.position?.y || 0)
    const rowSpacing = 200
    const colSpacing = 350

    // Start batch operation manually
    startBatchOperation()

    // Prepare node specs for batch creation
    const nodeSpecs = []
    const edgeSpecs = []

    for (let i = 0; i < segments.length; i++) {
      const content = segments[i]
      const segY = baseY + i * rowSpacing

      // Create text node
      const textSpec = {
        type: 'text',
        position: { x: baseX, y: segY },
        data: {
          content: content,
          label: `片段 ${i + 1}`
        }
      }
      nodeSpecs.push(textSpec)

      // Create imageConfig node
      const imageConfigSpec = {
        type: 'imageConfig',
        position: { x: baseX + colSpacing, y: segY },
        data: {
          label: `图片 ${i + 1}`,
          model: 'doubao-seedream-4-5-251128',
          size: '2048x2048'
        }
      }
      nodeSpecs.push(imageConfigSpec)
    }

    // Batch create nodes
    const createdIds = addNodes(nodeSpecs, false)

    // Create edges
    for (let i = 0; i < segments.length; i++) {
      const textId = createdIds[i * 2]
      const imageConfigId = createdIds[i * 2 + 1]

      // Connect LLM → text
      edgeSpecs.push({
        source: props.id,
        target: textId,
        sourceHandle: 'right',
        targetHandle: 'left'
      })

      // Connect text → imageConfig
      edgeSpecs.push({
        source: textId,
        target: imageConfigId,
        type: 'promptOrder',
        data: { promptOrder: 1 },
        sourceHandle: 'right',
        targetHandle: 'left'
      })
    }

    // Batch create edges
    addEdges(edgeSpecs, false)

    // End batch operation
    endBatchOperation()

    splitMessage.value = `已拆分 ${segments.length} 个图文节点`
    window.$message?.success(`已拆分为 ${segments.length} 个图文节点`)
  } catch (err) {
    window.$message?.error(`拆分失败: ${err.message}`)
  } finally {
    isSplitting.value = false
  }
}

/**
 * Split output by newlines into individual text nodes
 * 按换行拆分为多个文本节点
 */
const handleSplitToTextOnly = () => {
  if (!outputContent.value) return

  // Split by paragraphs (continuous non-empty lines as one segment)
  const segments = parseParagraphs(outputContent.value)

  if (segments.length <= 1) {
    window.$message?.warning('内容无法拆分（只有一段或内容为空）')
    return
  }

  doSplitToTextNodes(segments)
}

const doSplitToTextNodes = (segments) => {
  isSplitting.value = true
  splitMessage.value = ''

  try {
    const currentNode = nodes.value.find(n => n.id === props.id)
    const baseX = (currentNode?.position?.x || 0) + 450
    const baseY = (currentNode?.position?.y || 0)
    const rowSpacing = 180

    // Start batch operation manually
    startBatchOperation()

    // Prepare node specs for batch creation
    const nodeSpecs = segments.map((content, index) => ({
      type: 'text',
      position: { x: baseX, y: baseY + index * rowSpacing },
      data: {
        content: content,
        label: `拆分片段 ${index + 1}`
      }
    }))

    // Batch create nodes
    const createdIds = addNodes(nodeSpecs, false)

    // Prepare edge specs for batch creation
    const edgeSpecs = createdIds.map(nodeId => ({
      source: props.id,
      target: nodeId,
      sourceHandle: 'right',
      targetHandle: 'left'
    }))

    // Batch create edges
    addEdges(edgeSpecs, false)

    // End batch operation
    endBatchOperation()

    splitMessage.value = `已拆分为 ${segments.length} 个文本节点`
    window.$message?.success(`已拆分为 ${segments.length} 个文本节点`)
  } catch (err) {
    window.$message?.error(`拆分失败: ${err.message}`)
  } finally {
    isSplitting.value = false
  }
}

</script>

<style scoped>
.llm-node-wrapper {
  padding-right: 50px;
  padding-top: 20px;
  position: relative;
}

.llm-node {
  cursor: default;
  position: relative;
}

.llm-node textarea {
  cursor: text;
}

.llm-node pre {
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
}
</style>
