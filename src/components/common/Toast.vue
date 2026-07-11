<template>
  <Transition name="toast">
    <div v-if="visible" class="toast" :class="type">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  message: string
  type?: 'success' | 'info' | 'warning' | 'error'
}>()
</script>

<style scoped>
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px 20px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  z-index: 99999;
  text-align: center;
  min-width: 200px;
  max-width: 80%;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  font-size: 16px;
  pointer-events: none;
}

.toast.success {
  background: rgba(76, 175, 80, 0.9);
}

.toast.error {
  background: rgba(244, 67, 54, 0.9);
}

.toast.warning {
  background: rgba(255, 152, 0, 0.9);
}

.toast.info {
  background: rgba(33, 150, 243, 0.9);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -30%);
}
</style>
