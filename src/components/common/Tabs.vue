<template>
  <div class="tabs">
    <div class="tab-header">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-button', { active: modelValue === tab.key }]"
        @click="$emit('update:modelValue', tab.key)"
      >
        {{ tab.title }}
      </button>
    </div>
  <div class="tab-content">
      <template v-for="tab in tabs" :key="tab.key">
        <div v-show="modelValue === tab.key">
          <slot :name="tab.key"></slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  tabs: Array<{
    key: string;
    title: string;
  }>;
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<style scoped>
.tabs {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px 8px 0 0;
  padding: 0 0.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #fff;
}

.tab-button.active {
  color: #fff;
  border-bottom-color: rgba(255, 255, 255, 0.9);
}

.tab-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 0.5rem 0;
}

.tab-content > div {
  height: 100%;
}
</style>
