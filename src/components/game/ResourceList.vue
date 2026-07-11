<template>
  <ul class="resources-list">
    <li
      v-for="item in items"
      :key="item.id"
      class="resource-item"
      :class="{ 'food-item': isFood(item.id) }"
      :title="isFood(item.id) ? `点击食用 ${item.name ?? item.id}` : undefined"
      @click="handleClick(item)"
    >
      <span v-if="item.name" class="item-name">{{ item.name }}</span>
      <span v-if="item.count !== undefined" class="item-count">{{ item.count }}</span>
      <span v-if="isFood(item.id)" class="eat-hint">点击食用</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character'

interface ResourceItem {
  id: string | number
  name?: string
  count?: number
}

defineProps<{
  items: ResourceItem[]
}>()

const character = useCharacterStore()

const FOOD_ITEMS = new Set(['apple', 'berry'])

function isFood(id: string | number): boolean {
  return FOOD_ITEMS.has(String(id))
}

function handleClick(item: ResourceItem) {
  if (isFood(item.id)) {
    character.eatFood(String(item.id))
  }
}
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

.food-item {
  cursor: pointer;
}

.food-item:hover {
  background-color: #fffbe6;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.food-item:hover .eat-hint {
  display: block;
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

.eat-hint {
  display: none;
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
}
</style>

