<template>
  <div class="character-equipment">
    <!-- 区块一：当前穿戴槽位 -->
    <div class="section translucent-white">
      <h3 class="section-title">当前穿戴</h3>
      <div class="slots-grid">
        <div
          v-for="slot in SLOT_LIST"
          :key="slot.key"
          class="slot-row"
        >
          <span class="slot-label">{{ slot.label }}</span>
          <template v-if="equipment.slots[slot.key]">
            <span class="slot-icon">{{ getItemIcon(equipment.slots[slot.key]!) }}</span>
            <span class="slot-name">{{ getItemName(equipment.slots[slot.key]!) }}</span>
            <div class="durability-bar-wrap">
              <div
                class="durability-fill"
                :style="{ width: `${getDurabilityPercent(equipment.slots[slot.key]!)}%`, backgroundColor: getDurabilityColor(equipment.slots[slot.key]!) }"
              ></div>
            </div>
            <span class="durability-text">{{ getDurabilityPercent(equipment.slots[slot.key]!) }}%</span>
            <button class="btn-unequip" @click="equipment.unequip(slot.key)">卸下</button>
          </template>
          <template v-else>
            <span class="slot-empty">— 空 —</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 区块二：装备背包 -->
    <div class="section translucent-white">
      <h3 class="section-title">装备背包</h3>
      <div v-if="availableInventory.length === 0" class="empty-hint">背包中没有可用装备</div>
      <div v-for="item in availableInventory" :key="item.id" class="inventory-row">
        <span class="slot-icon">{{ getItemIcon(item.id) }}</span>
        <span class="inv-name">{{ getItemName(item.id) }}</span>
        <div class="durability-bar-wrap">
          <div
            class="durability-fill"
            :style="{ width: `${Math.round((item.durability / item.maxDurability) * 100)}%`, backgroundColor: getDurabilityColor(item.id) }"
          ></div>
        </div>
        <span class="durability-text">{{ item.durability }}/{{ item.maxDurability }}</span>
        <button
          class="btn-equip"
          :disabled="isEquipped(item.id)"
          @click="equipment.equip(item.id)"
        >{{ isEquipped(item.id) ? '已装备' : '装备' }}</button>
        <button
          v-if="item.durability < item.maxDurability"
          class="btn-repair"
          @click="equipment.repair(item.id)"
        >修理</button>
      </div>
    </div>

    <!-- 区块三：计算属性面板 -->
    <div class="section translucent-white">
      <h3 class="section-title">装备属性加成</h3>
      <template v-if="hasAnyStats">
        <div v-if="stats.attack" class="stat-row">
          <span class="stat-icon">⚔️</span>
          <span class="stat-label">攻击力</span>
          <span class="stat-value">+{{ stats.attack }}</span>
        </div>
        <div v-if="stats.defense" class="stat-row">
          <span class="stat-icon">🛡️</span>
          <span class="stat-label">防御力</span>
          <span class="stat-value">+{{ stats.defense }}</span>
        </div>
        <div v-if="stats.gatherSpeed" class="stat-row">
          <span class="stat-icon">🪓</span>
          <span class="stat-label">伐木效率</span>
          <span class="stat-value">+{{ Math.round(stats.gatherSpeed * 100) }}%</span>
        </div>
        <div v-if="stats.miningSpeed" class="stat-row">
          <span class="stat-icon">⛏️</span>
          <span class="stat-label">采矿效率</span>
          <span class="stat-value">+{{ Math.round(stats.miningSpeed * 100) }}%</span>
        </div>
        <div v-if="stats.energyCostMod" class="stat-row">
          <span class="stat-icon">💪</span>
          <span class="stat-label">体力消耗</span>
          <span class="stat-value">{{ stats.energyCostMod > 0 ? '+' : '' }}{{ stats.energyCostMod }}</span>
        </div>
      </template>
      <div v-else class="empty-hint">暂无装备加成</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEquipmentStore } from '../../stores/equipment'
import { ITEM_DEFINITIONS } from '../../data/items'
import type { EquipSlot } from '../../data/items'

const equipment = useEquipmentStore()

const SLOT_LIST: { key: EquipSlot; label: string }[] = [
  { key: 'mainHand', label: '主手' },
  { key: 'offHand', label: '副手' },
  { key: 'head', label: '头部' },
  { key: 'body', label: '身体' },
  { key: 'legs', label: '腿部' },
  { key: 'feet', label: '脚部' },
  { key: 'accessory', label: '饰品' },
]

function getItemIcon(itemId: string): string {
  const def = ITEM_DEFINITIONS[itemId]
  if (!def) return '?'
  if (def.icon.type === 'text') return def.icon.char
  return '?'
}

function getItemName(itemId: string): string {
  return ITEM_DEFINITIONS[itemId]?.name ?? itemId
}

function getDurabilityPercent(itemId: string): number {
  const item = equipment.inventory[itemId]
  if (!item || item.maxDurability === 0) return 0
  return Math.round((item.durability / item.maxDurability) * 100)
}

function getDurabilityColor(itemId: string): string {
  const p = getDurabilityPercent(itemId)
  if (p > 60) return 'rgba(76, 175, 80, 0.8)'
  if (p > 30) return 'rgba(255, 152, 0, 0.8)'
  return 'rgba(244, 67, 54, 0.8)'
}

function isEquipped(itemId: string): boolean {
  return Object.values(equipment.slots).includes(itemId)
}

const availableInventory = computed(() =>
  Object.entries(equipment.inventory)
    .filter(([, item]) => item.durability > 0)
    .map(([id, item]) => ({ id, ...item }))
)

const stats = computed(() => equipment.computedStats)
const hasAnyStats = computed(() =>
  stats.value.attack !== 0 ||
  stats.value.defense !== 0 ||
  stats.value.gatherSpeed !== 0 ||
  stats.value.miningSpeed !== 0 ||
  stats.value.energyCostMod !== 0
)
</script>

<style scoped>
.character-equipment {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section {
  padding: 0.8rem 1rem;
  border-radius: 8px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: bold;
  color: #486491;
  margin: 0 0 0.6rem 0;
}

.slots-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.slot-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2rem;
  border: 1px dashed rgba(72, 100, 145, 0.2);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
}

.slot-label {
  font-size: 0.8rem;
  color: #7a95b8;
  width: 2.5rem;
  flex-shrink: 0;
}

.slot-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.slot-name, .inv-name {
  font-size: 0.85rem;
  color: #333;
  flex-shrink: 0;
  min-width: 2.5rem;
}

.slot-empty {
  font-size: 0.8rem;
  color: #aaa;
  margin-left: 0.5rem;
}

.durability-bar-wrap {
  flex: 1;
  height: 6px;
  background-color: #ddd;
  border-radius: 3px;
  overflow: hidden;
  min-width: 30px;
}

.durability-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.durability-text {
  font-size: 0.75rem;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-unequip, .btn-equip, .btn-repair {
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-unequip {
  background-color: rgba(244, 67, 54, 0.15);
  color: #c62828;
}

.btn-unequip:hover {
  background-color: rgba(244, 67, 54, 0.3);
}

.btn-equip {
  background-color: rgba(33, 150, 243, 0.15);
  color: #1565c0;
}

.btn-equip:hover:not(:disabled) {
  background-color: rgba(33, 150, 243, 0.3);
}

.btn-equip:disabled {
  background-color: rgba(0, 0, 0, 0.05);
  color: #aaa;
  cursor: default;
}

.btn-repair {
  background-color: rgba(76, 175, 80, 0.15);
  color: #2e7d32;
}

.btn-repair:hover {
  background-color: rgba(76, 175, 80, 0.3);
}

.inventory-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.inventory-row:last-child {
  border-bottom: none;
}

.empty-hint {
  font-size: 0.85rem;
  color: #aaa;
  text-align: center;
  padding: 0.5rem 0;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0;
}

.stat-icon {
  font-size: 1rem;
  width: 1.5rem;
  text-align: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #486491;
  flex: 1;
}

.stat-value {
  font-size: 0.85rem;
  font-weight: bold;
  color: #333;
}
</style>
