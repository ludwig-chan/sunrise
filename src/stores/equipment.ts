import { defineStore } from 'pinia'
import { gameLog } from '../utils/eventBus'
import type { EquipSlot, EquipStats } from '../data/items'
import { ITEM_DEFINITIONS } from '../data/items'

export interface EquipmentItem {
  durability: number   // 当前耐久（0 = 损坏）
  maxDurability: number
}

export type EquipmentSlots = {
  [K in EquipSlot]: string | null  // 存储 item id，null = 空槽
}

export interface EquipmentState {
  inventory: Record<string, EquipmentItem>
  slots: EquipmentSlots
}

export const useEquipmentStore = defineStore('equipment', {
  state: (): EquipmentState => ({
    inventory: {
      axe: { durability: 0, maxDurability: 100 }
    },
    slots: {
      mainHand: null,
      offHand: null,
      head: null,
      body: null,
      legs: null,
      feet: null,
      accessory: null,
    }
  }),

  getters: {
    // 兼容旧代码：axe 的耐久度
    axe(): EquipmentItem {
      return this.inventory.axe ?? { durability: 0, maxDurability: 100 }
    },
    axeCount(): number {
      const axe = this.inventory.axe
      return axe && axe.durability > 0 ? 1 : 0
    },

    // 计算当前装备槽位带来的综合属性
    computedStats(): Required<EquipStats> {
      const base: Required<EquipStats> = {
        attack: 0,
        defense: 0,
        gatherSpeed: 0,
        miningSpeed: 0,
        energyCostMod: 0,
      }
      for (const itemId of Object.values(this.slots)) {
        if (!itemId) continue
        const def = ITEM_DEFINITIONS[itemId]
        if (!def?.equipStats) continue
        const s = def.equipStats
        if (s.attack) base.attack += s.attack
        if (s.defense) base.defense += s.defense
        if (s.gatherSpeed) base.gatherSpeed += s.gatherSpeed
        if (s.miningSpeed) base.miningSpeed += s.miningSpeed
        if (s.energyCostMod) base.energyCostMod += s.energyCostMod
      }
      return base
    },

    // 主手装备的 icon（用于主界面小图标显示）
    mainHandIcon(): string | null {
      const id = this.slots.mainHand
      if (!id) return null
      const def = ITEM_DEFINITIONS[id]
      if (!def) return null
      if (def.icon.type === 'text') return def.icon.char
      return null
    },

    // 副手装备的 icon
    offHandIcon(): string | null {
      const id = this.slots.offHand
      if (!id) return null
      const def = ITEM_DEFINITIONS[id]
      if (!def) return null
      if (def.icon.type === 'text') return def.icon.char
      return null
    }
  },

  actions: {
    // 制造斧头（兼容现有逻辑）
    async craftAxe(resources: { branch: number; ore: number }): Promise<boolean> {
      if (resources.branch >= 3 && resources.ore >= 2) {
        if (!this.inventory.axe) {
          this.inventory.axe = { durability: 0, maxDurability: 100 }
        }
        this.inventory.axe.durability = Math.min(
          this.inventory.axe.maxDurability,
          this.inventory.axe.durability + 100
        )
        gameLog({ text: '成功打造了一把石斧！', type: 'ITEM' })
        return true
      }
      return false
    },

    // 使用斧头（兼容现有逻辑）
    useAxe(amount: number = 5): boolean {
      const axe = this.inventory.axe
      // 如果库存中有可用斧头，直接消耗耐久
      if (axe && axe.durability > 0) {
        axe.durability -= amount
        if (axe.durability <= 0) {
          axe.durability = 0
          gameLog({ text: '斧头已经损坏了！', type: 'SYSTEM' })
        }
        return true
      }
      // 否则检查主手槽是否装备了有耐久的斧头
      if (this.slots.mainHand === 'axe' && axe && axe.durability > 0) {
        axe.durability -= amount
        if (axe.durability <= 0) {
          axe.durability = 0
          gameLog({ text: '斧头已经损坏了！', type: 'SYSTEM' })
        }
        return true
      }
      gameLog({ text: '需要装备斧头才能砍伐！', type: 'SYSTEM' })
      return false
    },

    // 装备物品到对应槽位
    equip(itemId: string): boolean {
      const def = ITEM_DEFINITIONS[itemId]
      if (!def?.equipSlot) return false
      const item = this.inventory[itemId]
      if (!item || item.durability <= 0) {
        gameLog({ text: `没有可用的${def.name}`, type: 'SYSTEM' })
        return false
      }
      this.slots[def.equipSlot] = itemId
      gameLog({ text: `装备了${def.name}`, type: 'ITEM' })
      return true
    },

    // 从槽位卸下装备
    unequip(slot: EquipSlot): void {
      const itemId = this.slots[slot]
      if (!itemId) return
      const def = ITEM_DEFINITIONS[itemId]
      this.slots[slot] = null
      if (def) gameLog({ text: `卸下了${def.name}`, type: 'ITEM' })
    },

    // 修理装备（消耗材料）
    repair(itemId: string, amount: number = 50): void {
      const item = this.inventory[itemId]
      if (!item) return
      item.durability = Math.min(item.maxDurability, item.durability + amount)
      const def = ITEM_DEFINITIONS[itemId]
      gameLog({ text: `修理了${def?.name ?? itemId}，耐久恢复了${amount}点`, type: 'ITEM' })
    }
  },

  persist: true
})
