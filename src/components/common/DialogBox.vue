<template>
  <Teleport to="body">
    <div v-if="isVisible" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog-box" @click.stop>
        <div class="dialog-content">
          <p class="dialog-message">{{ message }}</p>
          <div class="dialog-buttons">
            <button
              v-for="(option, index) in options"
              :key="index"
              class="dialog-button"
              @click="handleOptionClick(option)"
            >
              {{ option.text }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface DialogOption {
  text: string;
  value: any;
}

interface Props {
  message: string;
  options: DialogOption[];
  closeOnOverlay?: boolean;
}

interface Emits {
  (e: 'select', value: any): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()
const isVisible = ref(true)

const handleOptionClick = (option: DialogOption) => {
  isVisible.value = false
  emit('select', option.value)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    isVisible.value = false
    emit('close')
  }
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-box {
  background: #f5f5f5;
  border: 2px solid #2d3748;
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dialog-message {
  font-size: 1.1em;
  color: #2d3748;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.dialog-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.dialog-button {
  padding: 0.5rem 1.5rem;
  border: 1px solid #2d3748;
  background-color: #fff;
  color: #2d3748;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.2s ease;
}

.dialog-button:hover {
  background-color: #2d3748;
  color: #fff;
}
</style>
