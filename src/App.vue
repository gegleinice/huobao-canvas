<script setup>
import { computed } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme } from 'naive-ui'

const theme = computed(() => darkTheme)

const themeOverrides = {
  common: {
    borderRadius: '12px',
    borderRadiusSmall: '8px',
    primaryColor: '#c8a855',
    primaryColorHover: '#d4b366',
    primaryColorPressed: '#b8972e',
    primaryColorSuppl: '#c8a855',
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    bodyColor: '#050505',
    cardColor: '#0c0c0c',
    modalColor: '#0c0c0c',
    popoverColor: '#111111',
    tableColor: '#0c0c0c',
    inputColor: '#0a0a0a',
    actionColor: '#111111',
    borderColor: '#1c1c1c',
    dividerColor: '#1c1c1c',
    hoverColor: 'rgba(200, 168, 85, 0.06)',
    textColorBase: '#e8e8e8',
    textColor1: '#e8e8e8',
    textColor2: '#b0b0b0',
    textColor3: '#666666',
  },
  Dialog: {
    borderRadius: '16px',
    padding: '24px',
    color: '#0c0c0c',
  },
  Modal: {
    borderRadius: '16px',
    padding: '24px',
    color: '#0c0c0c',
  },
  Card: {
    borderRadius: '16px',
    padding: '24px',
    color: '#0c0c0c',
    borderColor: '#1c1c1c',
  },
  Button: {
    borderRadiusMedium: '10px',
    borderRadiusSmall: '8px',
    borderRadiusLarge: '12px',
    heightMedium: '36px',
    paddingMedium: '0 16px',
  },
  Input: {
    borderRadius: '10px',
    heightMedium: '36px',
    color: '#0a0a0a',
    borderColor: '#1c1c1c',
    colorFocus: '#0c0c0c',
  },
  Dropdown: {
    color: '#111111',
    borderRadius: '12px',
    optionColorHover: 'rgba(200, 168, 85, 0.08)',
  },
  Switch: {
    railColorActive: '#c8a855',
  },
  Tabs: {
    tabTextColorActiveLine: '#c8a855',
    tabTextColorHoverLine: '#d4b366',
    barColor: '#c8a855',
  },
  Tag: {
    borderRadius: '6px',
  },
}
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
