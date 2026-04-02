import { ref, watch } from 'vue'

export const isDark = ref(true)

watch(isDark, (value) => {
  document.documentElement.classList.toggle('dark', value)
}, { immediate: true })

export const toggleTheme = () => {
  // always dark
}
