<template>
  <div class="block-wrapper">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// 这是一个通用的内容块包装器组件，提供统一的视觉样式
</script>

<style scoped>
.block-wrapper {
  background-color: rgba(255, 255, 255, 0.75);
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  width: 100%;
}
</style>
