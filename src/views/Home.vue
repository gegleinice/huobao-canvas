<template>
  <div class="min-h-[100dvh] h-screen overflow-y-auto bg-[#050505]">
    <!-- Minimal Header -->
    <header class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-12 py-5">
      <div class="flex items-center">
        <span class="text-[17px] font-semibold text-white tracking-tight">臭鼬AIGC</span>
      </div>
      <button 
        @click="showApiSettings = true"
        class="p-2 rounded-xl transition-all duration-300"
        :class="isApiConfigured ? 'text-[#c8a855] hover:bg-[#c8a855]/10' : 'text-[#444] hover:bg-white/5'"
        title="API 设置"
      >
        <n-icon :size="18"><SettingsOutline /></n-icon>
      </button>
    </header>

    <main>
      <!-- Hero Section — TapNow style left-aligned -->
      <section class="px-8 md:px-12 pt-28 md:pt-36 pb-12 md:pb-16 max-w-6xl animate-fade-up">
        <h1 class="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold text-white leading-[1.05] tracking-tighter max-w-3xl">
          你的 AI 原生<br/>创意画布
        </h1>
        <p class="mt-6 text-lg md:text-xl text-[#888] max-w-xl leading-relaxed italic">
          统一调度文生图、图生视频与 AI 模型，在无限画布上节点式编排，零摩擦创作。
        </p>
        <div class="flex items-center gap-4 mt-10 animate-fade-up-delay-1">
          <button 
            @click="createNewProject"
            class="px-7 py-3.5 text-[15px] font-semibold rounded-full bg-white text-[#050505] hover:bg-[#e8e8e8] transition-all duration-300 ease-smooth active:scale-[0.97]"
          >
            开始创作
          </button>
          <button 
            @click="scrollToProjects"
            class="px-6 py-3.5 text-[15px] font-medium rounded-full border border-[#333] text-[#999] hover:border-[#555] hover:text-white transition-all duration-300 ease-smooth"
          >
            我的项目
          </button>
        </div>
      </section>

      <!-- Showcase — Canvas preview card -->
      <section class="px-8 md:px-12 pb-20 md:pb-28 animate-fade-up-delay-1">
        <div class="max-w-5xl">
          <div class="p-[1px] rounded-3xl bg-gradient-to-b from-[rgba(255,255,255,0.08)] via-[rgba(255,255,255,0.02)] to-transparent">
            <div class="rounded-3xl bg-[#0c0c0c] p-6 md:p-8 relative overflow-hidden min-h-[320px] md:min-h-[420px]">
              <!-- Grid dots background -->
              <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 24px 24px;"></div>
              
              <!-- Floating elements simulating canvas nodes -->
              <div class="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <!-- Input card -->
                <div class="w-full md:w-[280px] shrink-0 animate-fade-up-delay-2">
                  <div class="rounded-2xl bg-[#111] border border-[#1e1e1e] p-4">
                    <div class="text-[11px] uppercase tracking-[0.15em] text-[#555] mb-3">创意输入</div>
                    <textarea
                      v-model="inputText"
                      placeholder="描述你想要创作的画面..."
                      class="w-full bg-transparent resize-none outline-none text-[14px] text-[#ccc] placeholder:text-[#333] min-h-[80px] leading-relaxed"
                      @keydown.enter.ctrl="handleCreateWithInput"
                    />
                    <div class="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a]">
                      <div class="flex gap-1.5">
                        <button 
                          v-for="tag in suggestions.slice(0, 2)" 
                          :key="tag"
                          @click="inputText = tag"
                          class="px-2.5 py-1 text-[10px] tracking-wide rounded-full border border-[#222] text-[#555] hover:border-[#c8a855] hover:text-[#c8a855] transition-all duration-300"
                        >
                          {{ tag }}
                        </button>
                      </div>
                      <button 
                        @click="handleCreateWithInput"
                        class="w-8 h-8 rounded-xl bg-[#c8a855] hover:bg-[#b8972e] flex items-center justify-center transition-all duration-300 active:scale-95"
                      >
                        <n-icon :size="14" color="#050505"><SendOutline /></n-icon>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Decorative connection line -->
                <div class="hidden md:flex items-center self-center">
                  <div class="w-12 h-[1px] bg-gradient-to-r from-[#333] to-[#1a1a1a]"></div>
                  <div class="w-2 h-2 rounded-full bg-[#c8a855] shadow-[0_0_8px_rgba(200,168,85,0.4)]"></div>
                  <div class="w-12 h-[1px] bg-gradient-to-r from-[#1a1a1a] to-[#333]"></div>
                </div>

                <!-- Output preview cards -->
                <div class="flex-1 grid grid-cols-2 gap-3 animate-fade-up-delay-3">
                  <div class="rounded-xl bg-[#111] border border-[#1e1e1e] p-3 aspect-square flex flex-col justify-between">
                    <div class="text-[10px] uppercase tracking-[0.15em] text-[#555]">文生图</div>
                    <div class="flex-1 rounded-lg bg-gradient-to-br from-[#1a1510] via-[#0f0f0f] to-[#10151a] mt-2 flex items-center justify-center">
                      <n-icon :size="20" class="text-[#333]"><ImageOutline /></n-icon>
                    </div>
                  </div>
                  <div class="rounded-xl bg-[#111] border border-[#1e1e1e] p-3 aspect-square flex flex-col justify-between">
                    <div class="text-[10px] uppercase tracking-[0.15em] text-[#555]">图生视频</div>
                    <div class="flex-1 rounded-lg bg-gradient-to-br from-[#15101a] via-[#0f0f0f] to-[#1a1510] mt-2 flex items-center justify-center">
                      <n-icon :size="20" class="text-[#333]"><VideocamOutline /></n-icon>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ambient glow -->
              <div class="absolute -bottom-20 left-1/3 w-64 h-64 bg-[#c8a855] opacity-[0.03] blur-[100px] rounded-full"></div>
              <div class="absolute -top-20 right-1/4 w-48 h-48 bg-[#5588cc] opacity-[0.02] blur-[80px] rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features strip -->
      <section class="px-8 md:px-12 pb-16 md:pb-24 animate-fade-up-delay-3">
        <div class="max-w-5xl flex flex-wrap gap-3">
          <div v-for="feature in features" :key="feature" class="px-4 py-2 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] text-[12px] text-[#666] tracking-wide">
            {{ feature }}
          </div>
        </div>
      </section>

      <!-- Divider -->
      <div class="max-w-5xl mx-8 md:mx-12 h-[1px] bg-gradient-to-r from-transparent via-[#1a1a1a] to-transparent"></div>

      <!-- Projects Section -->
      <section ref="projectsSection" class="px-8 md:px-12 py-16 md:py-24 max-w-6xl">
        <div class="flex items-center justify-between mb-10">
          <h2 class="text-sm font-medium text-[#666] uppercase tracking-[0.2em]">我的项目</h2>
          <button 
            @click="createNewProject"
            class="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium tracking-wide rounded-full bg-white text-[#050505] hover:bg-[#e8e8e8] transition-all duration-300 ease-smooth active:scale-[0.97]"
          >
            <n-icon :size="12"><AddOutline /></n-icon>
            新建项目
          </button>
        </div>
        
        <!-- Empty state -->
        <div v-if="projects.length === 0" class="py-24 rounded-3xl border border-dashed border-[#1a1a1a] flex flex-col items-center">
          <div class="w-12 h-12 mb-6 rounded-2xl bg-[rgba(200,168,85,0.06)] flex items-center justify-center">
            <n-icon :size="20" class="text-[#c8a855]"><FolderOutline /></n-icon>
          </div>
          <p class="text-[#444] mb-8 text-sm">开始你的第一次创作</p>
          <button 
            @click="createNewProject"
            class="px-6 py-3 text-[13px] font-semibold rounded-full bg-white text-[#050505] hover:bg-[#e8e8e8] transition-all duration-300 ease-smooth active:scale-[0.97]"
          >
            创建项目
          </button>
        </div>
        
        <!-- Grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div 
            v-for="(project, idx) in projects" 
            :key="project.id"
            class="group relative"
          >
            <div @click="openProject(project)" class="cursor-pointer">
              <div class="p-[1px] rounded-2xl bg-gradient-to-b from-[rgba(255,255,255,0.04)] to-transparent group-hover:from-[rgba(200,168,85,0.15)] transition-all duration-500 ease-smooth mb-3">
                <div class="rounded-2xl bg-[#0c0c0c] overflow-hidden">
                  <div 
                    class="aspect-video bg-[#111] relative"
                    @mouseenter="handleThumbnailHover(project, true)"
                    @mouseleave="handleThumbnailHover(project, false)"
                  >
                    <template v-if="project.thumbnail">
                      <video 
                        v-if="isVideoUrl(project.thumbnail)"
                        :ref="el => setVideoRef(project.id, el)"
                        :src="project.thumbnail"
                        class="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-smooth"
                        muted loop playsinline
                      />
                      <img 
                        v-else
                        :src="project.thumbnail" 
                        :alt="project.name"
                        class="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-smooth"
                      />
                    </template>
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <n-icon :size="22" class="text-[#222]"><DocumentOutline /></n-icon>
                    </div>
                    
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500 ease-smooth flex items-center justify-center">
                      <span class="text-white text-[12px] font-medium tracking-wider opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 ease-smooth">OPEN</span>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-[13px] font-medium text-[#ccc] truncate">{{ project.name }}</p>
              <p class="text-[11px] text-[#444] mt-0.5">{{ formatDate(project.updatedAt) }}</p>
            </div>
            
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
              <n-dropdown :options="getProjectActions(project)" @select="(key) => handleProjectAction(key, project)" placement="bottom-end">
                <button 
                  @click.stop
                  class="p-1.5 bg-black/60 backdrop-blur-md rounded-lg hover:bg-black/80 transition-all duration-200"
                >
                  <n-icon :size="13" class="text-white/60"><EllipsisHorizontalOutline /></n-icon>
                </button>
              </n-dropdown>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="px-8 md:px-12 py-8 border-t border-[#111]">
        <div class="max-w-6xl">
          <span class="text-[11px] text-[#333] tracking-wide">臭鼬AIGC</span>
        </div>
      </footer>
    </main>

    <ApiSettings v-model:show="showApiSettings" @saved="refreshApiConfig" />

    <n-modal v-model:show="showRenameModal" preset="dialog" title="重命名项目">
      <n-input v-model:value="renameValue" placeholder="请输入项目名称" />
      <template #action>
        <n-button @click="showRenameModal = false">取消</n-button>
        <n-button type="primary" @click="confirmRename">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NDropdown, NModal, NInput, NButton, useDialog } from 'naive-ui'
import { 
  AddOutline, 
  ImageOutline, 
  SendOutline,
  RefreshOutline,
  DocumentOutline,
  FolderOutline,
  EllipsisHorizontalOutline,
  CreateOutline,
  CopyOutline,
  SettingsOutline,
  TrashOutline,
  VideocamOutline
} from '@vicons/ionicons5'
import { 
  projects, 
  initProjectsStore, 
  createProject, 
  deleteProject, 
  duplicateProject, 
  renameProject 
} from '../stores/projects'
import { useModelStore } from '../stores/pinia'
import ApiSettings from '../components/ApiSettings.vue'

const router = useRouter()
const dialog = useDialog()
const modelStore = useModelStore()

const showApiSettings = ref(false)
const isApiConfigured = computed(() => !!modelStore.currentApiKey)

const refreshApiConfig = () => {}

const videoRefs = new Map()

const setVideoRef = (projectId, el) => {
  if (el) {
    videoRefs.set(projectId, el)
  } else {
    videoRefs.delete(projectId)
  }
}

const handleThumbnailHover = (project, isHovering) => {
  if (!isVideoUrl(project.thumbnail)) return
  const video = videoRefs.get(project.id)
  if (!video) return
  if (isHovering) {
    video.play().catch(() => {})
  } else {
    video.pause()
    video.currentTime = 0
  }
}

const inputText = ref('')

const showRenameModal = ref(false)
const renameValue = ref('')
const renameTargetId = ref(null)

const suggestions = [
  '雨中魔法森林',
  '日式街面美食摄影',
  '瀑布水流飞溅',
  '雨天富声旁边花语'
]

const features = [
  '文生图',
  '图生视频',
  'AI 提示词润色',
  '多模型切换',
  '节点式编排',
  '无限画布',
  '本地存储',
  '撤销 / 重做'
]

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}

import { h } from 'vue'

const getProjectActions = (project) => [
  { label: '重命名', key: 'rename', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) },
  { label: '复制', key: 'duplicate', icon: () => h(NIcon, null, { default: () => h(CopyOutline) }) },
  { type: 'divider' },
  { label: '删除', key: 'delete', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) }
]

const handleProjectAction = (key, project) => {
  switch (key) {
    case 'rename':
      renameTargetId.value = project.id
      renameValue.value = project.name
      showRenameModal.value = true
      break
    case 'duplicate':
      const newId = duplicateProject(project.id)
      if (newId) {
        window.$message?.success('项目已复制')
      }
      break
    case 'delete':
      dialog.warning({
        title: '删除项目',
        content: `确定要删除项目「${project.name}」吗？此操作不可恢复。`,
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: () => {
          deleteProject(project.id)
          window.$message?.success('项目已删除')
        }
      })
      break
  }
}

const confirmRename = () => {
  if (renameTargetId.value && renameValue.value.trim()) {
    renameProject(renameTargetId.value, renameValue.value.trim())
    window.$message?.success('已重命名')
  }
  showRenameModal.value = false
  renameTargetId.value = null
  renameValue.value = ''
}

const checkApiKeyAndNavigate = (callback) => {
  if (!isApiConfigured.value) {
    dialog.warning({
      title: '未配置 API Key',
      content: '请先在设置中配置 API Key 才能使用画布功能。',
      positiveText: '知道了'
    })
    return false
  }
  callback()
  return true
}

const createNewProject = () => {
  checkApiKeyAndNavigate(() => {
    const id = createProject('未命名项目')
    router.push(`/canvas/${id}`)
  })
}

const handleCreateWithInput = () => {
  checkApiKeyAndNavigate(() => {
    const name = inputText.value.trim() || '未命名项目'
    const id = createProject(name)
    sessionStorage.setItem('ai-canvas-initial-prompt', inputText.value.trim())
    inputText.value = ''
    router.push(`/canvas/${id}`)
  })
}

const openProject = (project) => {
  checkApiKeyAndNavigate(() => {
    router.push(`/canvas/${project.id}`)
  })
}

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
  return videoExtensions.some(ext => url.toLowerCase().includes(ext))
}

const projectsSection = ref(null)

const scrollToProjects = () => {
  if (projectsSection.value) {
    projectsSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  initProjectsStore()
})
</script>
