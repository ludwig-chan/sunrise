<template>
  <div class="character-log">
    <div class="log-toolbar">
      <input
        type="text"
        v-model="searchText"
        placeholder="搜索日志..."
        class="log-search"
      />
      <div class="log-filter">
        <label
          v-for="type in messageTypes"
          :key="type"
          class="filter-label"
          :class="{ active: selectedTypes.includes(type) }"
          @click.prevent="toggleFilter(type)"
        >
          <input type="checkbox" :checked="selectedTypes.includes(type)" readonly />
          {{ getMessageTypeName(type) }}
        </label>
      </div>
    </div>
    <div class="log-messages" ref="logContainer">
      <div v-if="filteredEntries.length === 0" class="empty-hint">
        <p>{{ hasRetryCriteria ? '暂无匹配日志' : '暂无日志' }}</p>
        <button v-if="hasRetryCriteria" type="button" class="retry-button" @click="retryFilter">
          重试
        </button>
      </div>
      <template v-else v-for="(entry, index) in filteredEntries" :key="index">
        <div v-if="shouldShowDateDivider(entry, filteredEntries[index - 1])" class="date-divider">
          {{ formatDateDivider(entry.gameTimestamp) }}
        </div>
        <div class="log-entry">
          <span class="log-timestamp">【{{ formatSimpleTime(entry.gameTimestamp) }}】</span>
          <span class="log-text">{{ entry.text }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameLogStore } from '@/stores/gameLog'
import type { GameLogEntry } from '@/stores/gameLog'
import { seasonNames, type MessageType, messageTypeNames } from '@/utils/textMapping'
import type { Season } from '@/stores/time'

const gameLogStore = useGameLogStore()
const searchText = ref('')
const messageTypes: MessageType[] = ['SYSTEM', 'COMBAT', 'DIALOGUE', 'ACTION', 'ITEM']
const selectedTypes = ref<MessageType[]>([...messageTypes])

const getMessageTypeName = (type: MessageType) => messageTypeNames[type]

const toggleFilter = (type: MessageType) => {
  const index = selectedTypes.value.indexOf(type)
  if (index === -1) {
    selectedTypes.value.push(type)
  } else if (selectedTypes.value.length > 1) {
    selectedTypes.value.splice(index, 1)
  }
}

const filteredEntries = computed(() => {
  return gameLogStore.entries.filter(entry => {
    const matchesType = selectedTypes.value.includes(entry.type)
    const matchesSearch = searchText.value === '' ||
      entry.text.toLowerCase().includes(searchText.value.toLowerCase())
    return matchesType && matchesSearch
  })
})

const hasRetryCriteria = computed(() => {
  return searchText.value.trim() !== '' || selectedTypes.value.length !== messageTypes.length
})

const retryFilter = () => {
  searchText.value = ''
  selectedTypes.value = [...messageTypes]
}

const shouldShowDateDivider = (current: GameLogEntry, previous: GameLogEntry | undefined) => {
  if (!previous) return true
  return Math.floor(current.gameTimestamp / 24) !== Math.floor(previous.gameTimestamp / 24)
}

const formatDateDivider = (gameTimestamp: number) => {
  const year = Math.floor(gameTimestamp / 24 / 30 / 4) + 1
  const totalDays = Math.floor(gameTimestamp / 24)
  const day = (totalDays % 30) + 1
  const seasonIndex = Math.floor((totalDays % 120) / 30)
  const seasonTypes: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
  const season = seasonNames[seasonTypes[seasonIndex]]
  return `第${year}年 ${season} ${day}日`
}

const formatSimpleTime = (gameTimestamp: number) => {
  const hour = gameTimestamp % 24
  return `${hour}时`
}
</script>

<style scoped>
.character-log {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  min-height: 0;
}

.log-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.log-search {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.88rem;
  box-sizing: border-box;
}

.log-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.5);
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
  background: rgba(66, 153, 225, 0.2);
  border-color: #3182ce;
  color: #2b6cb0;
  font-weight: 500;
}

.filter-label input[type="checkbox"] {
  pointer-events: none;
  margin: 0;
}

.log-messages {
  flex: 1;
  overflow-y: auto;
  font-size: 0.88rem;
  line-height: 1.5;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  min-height: 0;
}

.empty-hint {
  color: #999;
  text-align: center;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-hint p {
  margin: 0;
}

.retry-button {
  border: none;
  border-radius: 999px;
  background: #3182ce;
  color: #fff;
  padding: 0.4rem 1rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.retry-button:hover {
  transform: translateY(-1px);
}

.date-divider {
  text-align: center;
  margin: 8px 0;
  position: relative;
  color: #999;
  font-size: 0.8rem;
}

.date-divider::before,
.date-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background-color: #ddd;
}

.date-divider::before {
  left: 0;
}

.date-divider::after {
  right: 0;
}

.log-entry {
  padding: 0.1rem 0;
}

.log-timestamp {
  color: #888;
  font-size: 0.85em;
  margin-right: 2px;
}

.log-text {
  color: #333;
}
</style>
