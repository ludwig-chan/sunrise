import { defineStore } from 'pinia'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [] as Array<{ id: string; type: string; name: string; count: number; acquiredAt?: number }>
  }),

  actions: {
    addItem(info: { id: string; type: string; name: string }, amount: number) {
      const existing = this.items.find(i => i.id === info.id)
      if (existing) {
        existing.count += amount
        // 更新获取时间为最新一次获取的时间（刷新保质期）
        existing.acquiredAt = Date.now()
      } else {
        this.items.push({ id: info.id, type: info.type, name: info.name, count: amount, acquiredAt: Date.now() })
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
