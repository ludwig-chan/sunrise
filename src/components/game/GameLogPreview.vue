<template>
  <div class="log-preview" :class="[`weather-${timeStore.weather.toLowerCase()}`, `period-${timeStore.currentPeriod.toLowerCase()}`]">
    <!-- Weather animation particles -->
    <template v-if="timeStore.weather === 'RAINY'">
      <span v-for="i in 16" :key="i" class="rain-drop" :style="rainStyle(i)" />
    </template>
    <template v-else-if="timeStore.weather === 'SNOWY'">
      <span v-for="i in 14" :key="i" class="snow-flake" :style="snowStyle(i)" />
    </template>
    <template v-else-if="timeStore.weather === 'WINDY'">
      <span v-for="i in 10" :key="i" class="wind-line" :style="windStyle(i)" />
    </template>
    <template v-else-if="timeStore.weather === 'HAIL'">
      <span v-for="i in 18" :key="i" class="hail-drop" :style="hailStyle(i)" />
    </template>
    <div v-else-if="timeStore.weather === 'SANDSTORM'" class="sandstorm-overlay" />
    <div v-else-if="timeStore.weather === 'HAZE'" class="haze-overlay" />

    <!-- Log entries -->
    <div class="log-content">
      <div v-if="displayEntries.length === 0" class="log-placeholder">暂无记录</div>
      <div
        v-for="entry in displayEntries"
        :key="entry.gameTimestamp"
        class="log-entry"
        :class="`type-${entry.type.toLowerCase()}`"
      >
        【{{ entry.gameTimestamp % 24 }}时】{{ entry.text }}
      </div>
      <div class="log-footer" @click="router.push('/logs')">查看全部 →</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTimeStore } from '@/stores/time'
import { useGameLogStore } from '@/stores/gameLog'
import type { GameLogEntry } from '@/stores/gameLog'

const router = useRouter()
const timeStore = useTimeStore()
const gameLogStore = useGameLogStore()

const displayEntries = computed<GameLogEntry[]>(() => {
  const entries = gameLogStore.entries
  if (entries.length === 0) return []

  let systemEntry: GameLogEntry | undefined
  let actionEntry: GameLogEntry | undefined

  // Single reverse pass to find the most recent SYSTEM and ACTION/ITEM entries
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]
    if (!systemEntry && e.type === 'SYSTEM') systemEntry = e
    if (!actionEntry && (e.type === 'ACTION' || e.type === 'ITEM')) actionEntry = e
    if (systemEntry && actionEntry) break
  }

  // Use wall-clock timestamp as unique key to avoid gameTimestamp collisions
  const picked = new Map<number, GameLogEntry>()
  if (systemEntry) picked.set(systemEntry.timestamp, systemEntry)
  if (actionEntry && actionEntry.timestamp !== systemEntry?.timestamp) {
    picked.set(actionEntry.timestamp, actionEntry)
  }

  // Fill up to 3 from the most recent entries if we have room
  for (let i = entries.length - 1; i >= 0 && picked.size < 3; i--) {
    const e = entries[i]
    if (!picked.has(e.timestamp)) {
      picked.set(e.timestamp, e)
    }
  }

  return [...picked.values()].sort((a, b) => b.gameTimestamp - a.gameTimestamp).slice(0, 3)
})

// Particle style helpers
function rainStyle(i: number): Record<string, string> {
  const left = ((i * 37 + 11) % 100)
  const delay = ((i * 0.17) % 1.2).toFixed(2)
  const duration = (0.6 + (i % 5) * 0.1).toFixed(2)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

function snowStyle(i: number): Record<string, string> {
  const left = ((i * 43 + 7) % 100)
  const delay = ((i * 0.3) % 3).toFixed(2)
  const duration = (2.5 + (i % 4) * 0.5).toFixed(2)
  const size = (3 + (i % 3)).toFixed(0)
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
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}
</script>

<style scoped>
/* ---- Container ---- */
.log-preview {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  width: 100%;
  background-color: rgba(100, 160, 220, 0.55);
}

/* ---- Period base colours ---- */
.log-preview.period-dawn  { background-color: rgba(220, 140, 100, 0.60); }
.log-preview.period-day   { background-color: rgba(100, 160, 220, 0.55); }
.log-preview.period-dusk  { background-color: rgba(210, 100, 70, 0.60); }
.log-preview.period-night { background-color: rgba(30, 40, 90, 0.70); }

/* Weather overrides blend on top via opacity/filter tweaks */
.log-preview.weather-rainy  { filter: brightness(0.92); }
.log-preview.weather-snowy  { filter: brightness(1.05); }
.log-preview.weather-haze   { filter: brightness(0.88) blur(0.4px); }
.log-preview.weather-sandstorm { filter: sepia(0.4) brightness(0.9); }

/* ---- Rain ---- */
.rain-drop {
  position: absolute;
  top: -10px;
  width: 2px;
  height: 10px;
  background: rgba(180, 210, 255, 0.7);
  border-radius: 1px;
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  from { transform: translateY(-10px); opacity: 0.8; }
  to   { transform: translateY(calc(100% + 50px)); opacity: 0.3; }
}

/* ---- Snow ---- */
.snow-flake {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  animation: snow-fall linear infinite;
}
@keyframes snow-fall {
  from { transform: translateY(-10px) translateX(0); opacity: 0.9; }
  50%  { transform: translateY(50%) translateX(6px); }
  to   { transform: translateY(calc(100% + 20px)) translateX(-4px); opacity: 0.4; }
}

/* ---- Wind ---- */
.wind-line {
  position: absolute;
  left: -60px;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.55), transparent);
  animation: wind-blow linear infinite;
}
@keyframes wind-blow {
  from { transform: translateX(-10px); opacity: 0.7; }
  to   { transform: translateX(calc(100vw + 80px)); opacity: 0; }
}

/* ---- Hail ---- */
.hail-drop {
  position: absolute;
  top: -8px;
  width: 4px;
  height: 6px;
  background: rgba(210, 235, 255, 0.85);
  border-radius: 1px;
  animation: hail-fall linear infinite;
}
@keyframes hail-fall {
  from { transform: translateY(-8px) translateX(0); opacity: 0.9; }
  to   { transform: translateY(calc(100% + 30px)) translateX(8px); opacity: 0.4; }
}

/* ---- Sandstorm overlay ---- */
.sandstorm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 140, 60, 0.35);
  backdrop-filter: blur(1.5px);
}

/* ---- Haze overlay ---- */
.haze-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 180, 180, 0.30);
  backdrop-filter: blur(1px);
}

/* ---- Log content ---- */
.log-content {
  position: relative;
  z-index: 1;
}

.log-placeholder {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.log-entry {
  font-size: 0.8rem;
  line-height: 1.5;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  color: #fff;
}

.log-entry.type-system {
  color: rgba(220, 240, 255, 0.9);
}

.log-entry.type-action,
.log-entry.type-item {
  color: #ffffff;
}

.log-entry.type-combat {
  color: #ff8a80;
}

.log-footer {
  margin-top: 0.3rem;
  font-size: 0.75rem;
  text-align: right;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  user-select: none;
}

.log-footer:hover {
  color: rgba(255, 255, 255, 0.9);
}
</style>
