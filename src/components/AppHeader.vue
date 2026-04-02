<template>
  <header class="flex items-center justify-between px-5 md:px-8 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
    <div class="flex items-center gap-2">
      <slot name="left"></slot>
    </div>
    
    <div class="flex items-center gap-1">
      <slot name="center"></slot>
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script setup>
</script>
