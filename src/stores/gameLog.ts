import { defineStore } from 'pinia'
import type { MessageType } from '../utils/textMapping'

export interface GameLogEntry {
  text: string
  type: MessageType
  gameTimestamp: number
  timestamp: number
}

export const useGameLogStore = defineStore('gameLog', {
  state: () => ({
    entries: [] as GameLogEntry[]
  }),
  actions: {
    addEntry(entry: GameLogEntry) {
      this.entries.push(entry)
      if (this.entries.length > 200) {
        this.entries = this.entries.slice(-200)
      }
    },
    clearEntries() {
      this.entries = []
    }
  },
  persist: true
})
