<template>
  <div class="floating-text-container">
    <TransitionGroup name="float">
      <div
        v-for="item in items"
        :key="item.id"
        class="floating-text"
        :class="item.type"
      >{{ item.text }}</div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { emitter } from '../../utils/eventBus'
import type { FloatingTextItem } from '../../utils/eventBus'

interface FloatingTextEntry extends FloatingTextItem {
  id: number
}

const items = ref<FloatingTextEntry[]>([])
let nextId = 0

const onFloatingText = (item: FloatingTextItem) => {
  const entry: FloatingTextEntry = { ...item, id: nextId++ }
  items.value.push(entry)
  // 1.5秒后移除
  setTimeout(() => {
    items.value = items.value.filter(i => i.id !== entry.id)
  }, 1500)
  // 最多保留5条，防止堆积
  if (items.value.length > 5) {
    items.value = items.value.slice(-5)
  }
}

emitter.on('floating-text', onFloatingText)

onUnmounted(() => {
  emitter.off('floating-text', onFloatingText)
})
</script>

<style scoped>
.floating-text-container {
  position: fixed;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99998;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.floating-text {
  font-size: 1.1rem;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}

.floating-text.gain {
  color: #4CAF50;
}

.floating-text.loss {
  color: #f44336;
}

.floating-text.info {
  color: #2196F3;
}

.float-enter-active {
  transition: all 0.6s ease-out;
}

.float-leave-active {
  transition: all 0.8s ease-in;
}

.float-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.float-leave-to {
  opacity: 0;
  transform: translateY(-40px) scale(1.1);
}

.float-move {
  transition: transform 0.4s ease;
}
</style>
