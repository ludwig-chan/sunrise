<template>
  <div class="logs-page" :class="isNight ? 'is-night' : 'is-day'">
    <PageHeader title="日志" />

    <!-- Toolbar: search + filter -->
    <div class="logs-toolbar">
      <input
        type="text"
        v-model="searchText"
        placeholder="搜索日志..."
        class="log-search"
      />
      <FilterBar
        :items="MESSAGE_TYPE_ITEMS"
        :model-value="selectedTypes"
        @update:model-value="selectedTypes = $event"
        class="logs-filter-bar"
      />
    </div>

    <!-- Log card with weather animation inside -->
    <div class="log-card">
      <!-- Weather animation particles -->
      <template v-if="timeStore.weather === 'RAINY'">
        <span v-for="i in 18" :key="i" class="rain-drop" :style="rainStyle(i)" />
      </template>
      <template v-else-if="timeStore.weather === 'SNOWY'">
        <span v-for="i in 16" :key="i" class="snow-flake" :style="snowStyle(i)" />
      </template>
      <template v-else-if="timeStore.weather === 'WINDY'">
        <span v-for="i in 12" :key="i" class="wind-line" :style="windStyle(i)" />
      </template>
      <template v-else-if="timeStore.weather === 'HAIL'">
        <span v-for="i in 20" :key="i" class="hail-drop" :style="hailStyle(i)" />
      </template>
      <div v-else-if="timeStore.weather === 'SANDSTORM'" class="sandstorm-overlay" />
      <div v-else-if="timeStore.weather === 'HAZE'" class="haze-overlay" />

      <!-- Semi-transparent overlay for readability -->
      <div class="readability-overlay" />

      <!-- Log entries -->
      <div class="log-messages" ref="logContainer">
        <div v-if="filteredEntries.length === 0" class="empty-hint">
          <p>{{ hasRetryCriteria ? '暂无匹配日志' : '暂无日志' }}</p>
          <button v-if="hasRetryCriteria" type="button" class="retry-button" @click="retryFilter">
            重试
          </button>
        </div>
        <template v-else v-for="(entry, index) in filteredEntries" :key="index">
          <div
            v-if="shouldShowDateDivider(entry, filteredEntries[index - 1])"
            class="date-divider"
          >
            {{ formatDateDivider(entry.gameTimestamp) }}
          </div>
          <div class="log-entry" :class="`type-${entry.type.toLowerCase()}`">
            <span class="log-timestamp">【{{ formatSimpleTime(entry.gameTimestamp) }}】</span>
            <span class="log-text">{{ entry.text }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTimeStore } from '@/stores/time'
import { useGameLogStore } from '@/stores/gameLog'
import type { GameLogEntry } from '@/stores/gameLog'
import { seasonNames, messageTypeNames, type MessageType } from '@/utils/textMapping'
import type { Season } from '@/stores/time'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'

const timeStore = useTimeStore()
const gameLogStore = useGameLogStore()

const searchText = ref('')

const MESSAGE_TYPES: MessageType[] = ['SYSTEM', 'COMBAT', 'DIALOGUE', 'ACTION', 'ITEM']
const MESSAGE_TYPE_ITEMS = MESSAGE_TYPES.map(t => ({ key: t, label: messageTypeNames[t] }))
const selectedTypes = ref<Set<string>>(new Set())

// Day/night detection: NIGHT = dark background, others = light
const isNight = computed(() => timeStore.currentPeriod === 'NIGHT')

const filteredEntries = computed(() => {
  return gameLogStore.entries.filter(entry => {
    const matchesType =
      selectedTypes.value.size === 0 || selectedTypes.value.has(entry.type)
    const matchesSearch =
      searchText.value === '' ||
      entry.text.toLowerCase().includes(searchText.value.toLowerCase())
    return matchesType && matchesSearch
  })
})

const hasRetryCriteria = computed(() => {
  return searchText.value.trim() !== '' || selectedTypes.value.size > 0
})

function retryFilter() {
  searchText.value = ''
  selectedTypes.value = new Set()
}

function shouldShowDateDivider(current: GameLogEntry, previous: GameLogEntry | undefined) {
  if (!previous) return true
  return Math.floor(current.gameTimestamp / 24) !== Math.floor(previous.gameTimestamp / 24)
}

function formatDateDivider(gameTimestamp: number) {
  const year = Math.floor(gameTimestamp / 24 / 30 / 4) + 1
  const totalDays = Math.floor(gameTimestamp / 24)
  const day = (totalDays % 30) + 1
  const seasonIndex = Math.floor((totalDays % 120) / 30)
  const seasonTypes: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
  const season = seasonNames[seasonTypes[seasonIndex]]
  return `第${year}年 ${season} ${day}日`
}

function formatSimpleTime(gameTimestamp: number) {
  const hour = gameTimestamp % 24
  return `${hour}时`
}

// Particle style helpers
function rainStyle(i: number): Record<string, string> {
  const left = ((i * 37 + 11) % 100)
  const delay = ((i * 0.17) % 1.2).toFixed(2)
  const duration = (0.6 + (i % 5) * 0.1).toFixed(2)
  return { left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }
}

function snowStyle(i: number): Record<string, string> {
  const left = ((i * 43 + 7) % 100)
  const delay = ((i * 0.3) % 3).toFixed(2)
  const duration = (2.5 + (i % 4) * 0.5).toFixed(2)
  const size = (8 + (i % 4) * 2).toFixed(0)
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function windStyle(i: number): Record<string, string> {
  const top = ((i * 31 + 5) % 90)
  const delay = ((i * 0.2) % 1.5).toFixed(2)
  const width = (20 + (i % 5) * 8).toFixed(0)
  const duration = (0.8 + (i % 4) * 0.15).toFixed(2)
  return {
    top: `${top}%`,
    width: `${width}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function hailStyle(i: number): Record<string, string> {
  const left = ((i * 41 + 13) % 100)
  const delay = ((i * 0.12) % 0.9).toFixed(2)
  const duration = (0.35 + (i % 4) * 0.05).toFixed(2)
  return { left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }
}
</script>

<style scoped>
/* ---- Page layout ---- */
.logs-page {
  position: relative;
  min-height: 100vh;
  padding: 4rem 1.2rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* ---- Toolbar ---- */
.logs-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.log-search {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.88rem;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.15s;
}

.is-day .log-search {
  border: 1px solid #ccc;
  background: #fff;
  color: #1a1a1a;
}

.is-night .log-search {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.07);
  color: #e0e0e8;
}

.is-night .log-search::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

/* FilterBar dark-mode override */
.is-night .logs-filter-bar :deep(.filter-label) {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.65);
}

.is-night .logs-filter-bar :deep(.filter-label:hover) {
  background: rgba(99, 179, 237, 0.2);
  border-color: #63b3ed;
  color: #bee3f8;
}

.is-night .logs-filter-bar :deep(.filter-label.active) {
  background: rgba(99, 179, 237, 0.3);
  border-color: #4299e1;
  color: #bee3f8;
}

/* ---- Log card (weather animations live here) ---- */
.log-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  flex: 1;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
}

.is-day .log-card {
  background: rgba(200, 220, 255, 0.35);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.is-night .log-card {
  background: rgba(20, 24, 50, 0.8);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

/* Semi-transparent overlay for readability on top of weather particles */
.readability-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.is-day .readability-overlay {
  background: rgba(255, 255, 255, 0.45);
}

.is-night .readability-overlay {
  background: rgba(0, 0, 0, 0.35);
}

/* ---- Log messages ---- */
.log-messages {
  position: relative;
  z-index: 2;
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  font-size: 0.88rem;
  line-height: 1.6;
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

.is-night .empty-hint {
  color: rgba(255, 255, 255, 0.35);
}

.empty-hint p {
  margin: 0;
}

.retry-button {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.retry-button:hover {
  transform: translateY(-1px);
}

.is-day .retry-button {
  background: #3182ce;
  color: #fff;
}

.is-night .retry-button {
  background: rgba(99, 179, 237, 0.24);
  color: #bee3f8;
  border: 1px solid rgba(99, 179, 237, 0.35);
}

.date-divider {
  text-align: center;
  margin: 10px 0;
  position: relative;
  font-size: 0.8rem;
}

.is-day .date-divider {
  color: #999;
}

.is-night .date-divider {
  color: rgba(255, 255, 255, 0.4);
}

.date-divider::before,
.date-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
}

.is-day .date-divider::before,
.is-day .date-divider::after {
  background-color: #ddd;
}

.is-night .date-divider::before,
.is-night .date-divider::after {
  background-color: rgba(255, 255, 255, 0.15);
}

.date-divider::before { left: 0; }
.date-divider::after  { right: 0; }

.log-entry {
  padding: 0.1rem 0;
}

.log-timestamp {
  font-size: 0.85em;
  margin-right: 2px;
}

.is-day .log-timestamp  { color: #888; }
.is-night .log-timestamp { color: rgba(255, 255, 255, 0.45); }

.is-day .log-text   { color: #333; }
.is-night .log-text { color: rgba(255, 255, 255, 0.85); }

.is-day .log-entry.type-system   { color: #1a73e8; }
.is-night .log-entry.type-system { color: rgba(160, 200, 255, 0.9); }

.is-day .log-entry.type-combat   { color: #c53030; }
.is-night .log-entry.type-combat { color: #ff8a80; }

.is-day .log-entry.type-dialogue   { color: #276749; }
.is-night .log-entry.type-dialogue { color: #9ae6b4; }

/* ---- Weather particles (positioned inside .log-card) ---- */
.rain-drop {
  position: absolute;
  top: -10px;
  width: 4px;
  height: 8px;
  background: rgba(180, 210, 255, 0.65);
  border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
  animation: rain-fall linear infinite;
  z-index: 0;
}
@keyframes rain-fall {
  from { transform: translateY(-10px); opacity: 0.8; }
  to   { transform: translateY(calc(100% + 50px)); opacity: 0.2; }
}

.snow-flake {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  animation: snow-fall linear infinite;
  z-index: 0;
}
@keyframes snow-fall {
  from { transform: translateY(-10px) translateX(0); opacity: 0.9; }
  50%  { transform: translateY(50%) translateX(6px); }
  to   { transform: translateY(calc(100% + 20px)) translateX(-4px); opacity: 0.3; }
}

.wind-line {
  position: absolute;
  left: -60px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.45), transparent);
  animation: wind-blow linear infinite;
  z-index: 0;
}
@keyframes wind-blow {
  from { transform: translateX(-10px); opacity: 0.6; }
  to   { transform: translateX(calc(100vw + 80px)); opacity: 0; }
}

.hail-drop {
  position: absolute;
  top: -8px;
  width: 4px;
  height: 6px;
  background: rgba(210, 235, 255, 0.8);
  border-radius: 1px;
  animation: hail-fall linear infinite;
  z-index: 0;
}
@keyframes hail-fall {
  from { transform: translateY(-8px) translateX(0); opacity: 0.9; }
  to   { transform: translateY(calc(100% + 30px)) translateX(8px); opacity: 0.3; }
}

.sandstorm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 140, 60, 0.28);
  backdrop-filter: blur(1.5px);
  z-index: 0;
}

.haze-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 180, 180, 0.25);
  backdrop-filter: blur(1px);
  z-index: 0;
}
</style>
