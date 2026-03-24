<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal-card translucent-white">
          <div class="modal-menu">
            <button class="menu-item menu-item--resume" @click="handleResume">
              ▶ 继续游戏
            </button>
            <hr class="menu-divider" />
            <button class="menu-item" @click="goToCharacter">
              👤 个人信息
            </button>
            <button class="menu-item" @click="goToSettings">
              ⚙️ 设置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'resume'): void
}>()

const router = useRouter()

function handleResume() {
  emit('resume')
  emit('update:modelValue', false)
}

function handleOverlayClick() {
  emit('resume')
  emit('update:modelValue', false)
}

function goToCharacter() {
  router.push('/character')
}

function goToSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  border-radius: 12px;
  padding: 1.2rem 1rem;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-menu {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #333;
  transition: background-color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.menu-item:hover,
.menu-item:active {
  background-color: rgba(72, 100, 145, 0.12);
}

.menu-item--resume {
  color: #486491;
  font-weight: 600;
}

.menu-divider {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 0.2rem 0;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: scale(0.95);
}
</style>
