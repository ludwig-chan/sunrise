<template>
  <div class="log-preview" @click="router.push('/logs')">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameLogStore } from '@/stores/gameLog'
import type { GameLogEntry } from '@/stores/gameLog'

const router = useRouter()
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
</script>

<style scoped>
/* ---- Container ---- */
.log-preview {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  transition: box-shadow 0.2s ease, opacity 0.2s ease;
}

.log-preview:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0.92;
}

/* ---- Log content ---- */
.log-content {
  position: relative;
  z-index: 1;
}

.log-placeholder {
  color: rgba(0, 0, 0, 0.55);
  font-size: 0.8rem;
}

.log-entry {
  font-size: 0.8rem;
  line-height: 1.5;
  color: #486491;
}

.log-entry.type-system {
  color: #486491;
}

.log-entry.type-action,
.log-entry.type-item {
  color: #333;
}

.log-entry.type-combat {
  color: #c0392b;
}
</style>
