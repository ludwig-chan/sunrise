import { defineStore } from 'pinia'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [] as Array<{ id: string; type: string; name: string; count: number }>
  }),

  actions: {
    addItem(info: { id: string; type: string; name: string }, amount: number) {
      const existing = this.items.find(i => i.id === info.id)
      if (existing) {
        existing.count += amount
      } else {
        this.items.push({ id: info.id, type: info.type, name: info.name, count: amount })
      }
    },

    removeItem(id: string, amount: number): boolean {
      const item = this.items.find(i => i.id === id)
      if (!item || item.count < amount) return false
      item.count -= amount
      if (item.count === 0) {
        this.items = this.items.filter(i => i.id !== id)
      }
      return true
    },

    getCount(id: string): number {
      return this.items.find(i => i.id === id)?.count ?? 0
    },

    hasEnough(id: string, amount: number): boolean {
      return this.getCount(id) >= amount
    }
  },

  persist: true
})
