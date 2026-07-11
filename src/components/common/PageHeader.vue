<template>
  <header class="page-header">
    <button class="back-btn" @click="router.back()">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <h1 class="page-title">{{ title }}</h1>
    <div class="header-right" />
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ title: string }>()

const router = useRouter()
</script>

<style scoped>
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 3rem;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
}

.back-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0 0.75rem;
  font-size: 0.95rem;
}

.back-btn:hover {
  opacity: 0.75;
}

.page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.header-right {
  flex: 1;
}
</style>
