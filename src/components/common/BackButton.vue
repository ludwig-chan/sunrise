<template>
  <button class="back-button" @click="handleBack">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
    <span class="back-label">返回</span>
  </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.back-button {
  position: absolute;
  top: 1rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.3rem 0.7rem;
  transition: background 0.2s, color 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.back-button:hover {
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
}
</style>
