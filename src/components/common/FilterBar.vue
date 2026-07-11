<template>
  <div class="filter-bar">
    <label
      v-for="item in items"
      :key="item.key"
      class="filter-label"
      :class="{ active: modelValue.has(item.key) }"
      @click.prevent="selectOnly(item.key)"
    >
      <input
        type="checkbox"
        :checked="modelValue.has(item.key)"
        @click.stop="toggle(item.key)"
      /> {{ item.label }}
    </label>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: ReadonlyArray<{ key: string; label: string }>
  modelValue: Set<string>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Set<string>): void
}>()

function selectOnly(key: string) {
  if (props.modelValue.size === 1 && props.modelValue.has(key)) {
    emit('update:modelValue', new Set())
  } else {
    emit('update:modelValue', new Set([key]))
  }
}

function toggle(key: string) {
  const next = new Set(props.modelValue)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  emit('update:modelValue', next)
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 0.2rem;
  flex-wrap: wrap;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #666;
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
}

.filter-label:hover {
  background: rgba(66, 153, 225, 0.15);
  border-color: #4299e1;
  color: #2b6cb0;
}

.filter-label.active {
  background: rgba(66, 153, 225, 0.25);
  border-color: #3182ce;
  color: #2b6cb0;
  font-weight: 500;
}

.filter-label input[type="checkbox"] {
  margin: 0;
}
</style>
