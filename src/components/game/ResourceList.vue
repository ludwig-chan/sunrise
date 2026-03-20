<template>
  <ul class="resources-list">
    <li v-for="item in items" :key="item.id" class="resource-item">
      <span v-if="item.name" class="item-name">{{ item.name }}</span>
      <span v-if="item.count !== undefined" class="item-count">{{ item.count }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
interface ResourceItem {
  id: string | number
  name?: string
  count?: number
}

defineProps<{
  items: ResourceItem[]
}>()
</script>

<style scoped>
.resources-list {
  list-style: none;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
}

.resource-item {
  width: 60px;
  height: 60px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 6px;
  font-size: 12px;
  position: relative;
  box-sizing: border-box;
}

.item-name {
  word-break: break-word;
  font-size: 11px;
  line-height: 1.2;
}

.item-count {
  position: absolute;
  bottom: 3px;
  right: 3px;
  background-color: rgba(0, 0, 0, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
}
</style>
