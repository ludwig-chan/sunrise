<template>
  <div class="character-equipment">
    <!-- 区块一：RPG 风格装备布局（人物居中，槽位环绕） -->
    <div class="section translucent-white equip-layout">
      <h3 class="section-title">当前穿戴</h3>
      <div class="equip-grid">
        <!-- 帽子：头顶 -->
        <div class="equip-cell cell-head">
          <div class="slot-card" :class="{ 'slot-equipped': !!equipment.slots.head }">
            <div class="slot-header">
              <span class="slot-icon-bg">🪖</span>
              <span class="slot-label">帽子</span>
            </div>
            <template v-if="equipment.slots.head">
              <div class="slot-item-info">
                <span class="slot-item-icon">{{ getItemIcon(equipment.slots.head) }}</span>
                <span class="slot-item-name">{{ getItemName(equipment.slots.head) }}</span>
              </div>
              <div class="durability-bar-wrap">
                <div class="durability-fill" :style="{ width: `${getDurabilityPercent(equipment.slots.head)}%`, backgroundColor: getDurabilityColor(equipment.slots.head) }"></div>
              </div>
              <div class="slot-footer">
                <span class="durability-text">{{ getDurabilityPercent(equipment.slots.head) }}%</span>
                <button class="btn-unequip" @click="equipment.unequip('head')">卸下</button>
              </div>
            </template>
            <template v-else><div class="slot-empty">— 空 —</div></template>
          </div>
        </div>

        <!-- 武器：左侧 -->
        <div class="equip-cell cell-weapon">
          <div class="slot-card" :class="{ 'slot-equipped': !!equipment.slots.mainHand }">
            <div class="slot-header">
              <span class="slot-icon-bg">⚔️</span>
              <span class="slot-label">武器</span>
            </div>
            <template v-if="equipment.slots.mainHand">
              <div class="slot-item-info">
                <span class="slot-item-icon">{{ getItemIcon(equipment.slots.mainHand) }}</span>
                <span class="slot-item-name">{{ getItemName(equipment.slots.mainHand) }}</span>
              </div>
              <div class="durability-bar-wrap">
                <div class="durability-fill" :style="{ width: `${getDurabilityPercent(equipment.slots.mainHand)}%`, backgroundColor: getDurabilityColor(equipment.slots.mainHand) }"></div>
              </div>
              <div class="slot-footer">
                <span class="durability-text">{{ getDurabilityPercent(equipment.slots.mainHand) }}%</span>
                <button class="btn-unequip" @click="equipment.unequip('mainHand')">卸下</button>
              </div>
            </template>
            <template v-else><div class="slot-empty">— 空 —</div></template>
          </div>
        </div>

        <!-- 人物：中间 -->
        <div class="equip-cell cell-character">
          <div class="pixel-character-wrap">
            <div class="pixel-character" :data-gender="character.gender">
              <div class="pixel-head">
                <div class="pixel-head-inner"></div>
              </div>
              <div class="pixel-neck"></div>
              <div class="pixel-body">
                <div class="pixel-arm left"></div>
                <div class="pixel-torso"></div>
                <div class="pixel-arm right"></div>
              </div>
              <div class="pixel-legs">
                <div class="pixel-leg left"></div>
                <div class="pixel-leg right"></div>
              </div>
              <div class="pixel-feet">
                <div class="pixel-foot left"></div>
                <div class="pixel-foot right"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 铠甲：右侧 -->
        <div class="equip-cell cell-body">
          <div class="slot-card" :class="{ 'slot-equipped': !!equipment.slots.body }">
            <div class="slot-header">
              <span class="slot-icon-bg">🛡️</span>
              <span class="slot-label">铠甲</span>
            </div>
            <template v-if="equipment.slots.body">
              <div class="slot-item-info">
                <span class="slot-item-icon">{{ getItemIcon(equipment.slots.body) }}</span>
                <span class="slot-item-name">{{ getItemName(equipment.slots.body) }}</span>
              </div>
              <div class="durability-bar-wrap">
                <div class="durability-fill" :style="{ width: `${getDurabilityPercent(equipment.slots.body)}%`, backgroundColor: getDurabilityColor(equipment.slots.body) }"></div>
              </div>
              <div class="slot-footer">
                <span class="durability-text">{{ getDurabilityPercent(equipment.slots.body) }}%</span>
                <button class="btn-unequip" @click="equipment.unequip('body')">卸下</button>
              </div>
            </template>
            <template v-else><div class="slot-empty">— 空 —</div></template>
          </div>
        </div>

        <!-- 鞋子：脚下 -->
        <div class="equip-cell cell-feet">
          <div class="slot-card" :class="{ 'slot-equipped': !!equipment.slots.feet }">
            <div class="slot-header">
              <span class="slot-icon-bg">👟</span>
              <span class="slot-label">鞋子</span>
            </div>
            <template v-if="equipment.slots.feet">
              <div class="slot-item-info">
                <span class="slot-item-icon">{{ getItemIcon(equipment.slots.feet) }}</span>
                <span class="slot-item-name">{{ getItemName(equipment.slots.feet) }}</span>
              </div>
              <div class="durability-bar-wrap">
                <div class="durability-fill" :style="{ width: `${getDurabilityPercent(equipment.slots.feet)}%`, backgroundColor: getDurabilityColor(equipment.slots.feet) }"></div>
              </div>
              <div class="slot-footer">
                <span class="durability-text">{{ getDurabilityPercent(equipment.slots.feet) }}%</span>
                <button class="btn-unequip" @click="equipment.unequip('feet')">卸下</button>
              </div>
            </template>
            <template v-else><div class="slot-empty">— 空 —</div></template>
          </div>
        </div>

        <!-- 饰品：右下 -->
        <div class="equip-cell cell-accessory">
          <div class="slot-card" :class="{ 'slot-equipped': !!equipment.slots.accessory }">
            <div class="slot-header">
              <span class="slot-icon-bg">✨</span>
              <span class="slot-label">饰品</span>
            </div>
            <template v-if="equipment.slots.accessory">
              <div class="slot-item-info">
                <span class="slot-item-icon">{{ getItemIcon(equipment.slots.accessory) }}</span>
                <span class="slot-item-name">{{ getItemName(equipment.slots.accessory) }}</span>
              </div>
              <div class="durability-bar-wrap">
                <div class="durability-fill" :style="{ width: `${getDurabilityPercent(equipment.slots.accessory)}%`, backgroundColor: getDurabilityColor(equipment.slots.accessory) }"></div>
              </div>
              <div class="slot-footer">
                <span class="durability-text">{{ getDurabilityPercent(equipment.slots.accessory) }}%</span>
                <button class="btn-unequip" @click="equipment.unequip('accessory')">卸下</button>
              </div>
            </template>
            <template v-else><div class="slot-empty">— 空 —</div></template>
          </div>
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
        <div v-if="stats.magicMod" class="stat-row">
          <span class="stat-icon">✨</span>
          <span class="stat-label">魔法加成</span>
          <span class="stat-value">{{ stats.magicMod > 0 ? '+' : '' }}{{ stats.magicMod }}</span>
        </div>
        <div v-if="stats.moodMod" class="stat-row">
          <span class="stat-icon">😊</span>
          <span class="stat-label">心情加成</span>
          <span class="stat-value">{{ stats.moodMod > 0 ? '+' : '' }}{{ stats.moodMod }}</span>
        </div>
        <div v-if="stats.hungerMod" class="stat-row">
          <span class="stat-icon">🍖</span>
          <span class="stat-label">饥饿消耗</span>
          <span class="stat-value">{{ stats.hungerMod > 0 ? '+' : '' }}{{ stats.hungerMod }}</span>
        </div>
      </template>
      <div v-else class="empty-hint">暂无装备加成</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEquipmentStore } from '../../stores/equipment'
import { useCharacterStore } from '../../stores/character'
import { ITEM_DEFINITIONS } from '../../data/items'

const equipment = useEquipmentStore()
const character = useCharacterStore()

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
  stats.value.energyCostMod !== 0 ||
  stats.value.magicMod !== 0 ||
  stats.value.moodMod !== 0 ||
  stats.value.hungerMod !== 0
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

/* 装备页面布局：RPG 风格，人物居中 */
.equip-layout {
  /* section padding already applied */
}

.equip-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: auto auto auto;
  gap: 0.5rem;
  align-items: center;
  justify-items: stretch;
}

/* 各格子位置 */
.cell-head {
  grid-column: 2;
  grid-row: 1;
}

.cell-weapon {
  grid-column: 1;
  grid-row: 2;
}

.cell-character {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  justify-content: center;
}

.cell-body {
  grid-column: 3;
  grid-row: 2;
}

.cell-feet {
  grid-column: 2;
  grid-row: 3;
}

.cell-accessory {
  grid-column: 3;
  grid-row: 3;
}

/* ===== 像素风全身人物 ===== */
.pixel-character-wrap {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}

.pixel-character {
  display: flex;
  flex-direction: column;
  align-items: center;
  image-rendering: pixelated;
  gap: 0;
}

/* 头部 */
.pixel-head {
  width: 32px;
  height: 32px;
  background-color: #f5c89a;
  border: 2px solid #c8855a;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pixel-character[data-gender='female'] .pixel-head {
  background-color: #f7d4b0;
  border-color: #c8885e;
}

.pixel-head-inner {
  width: 22px;
  height: 12px;
  background-color: transparent;
  position: relative;
}

/* 头发 */
.pixel-head-inner::before {
  content: '';
  position: absolute;
  top: -8px;
  left: -3px;
  width: 28px;
  height: 8px;
  background-color: #5a3a1a;
  border-radius: 1px 1px 0 0;
}

.pixel-character[data-gender='female'] .pixel-head-inner::before {
  background-color: #8b4513;
  height: 10px;
  top: -10px;
  width: 30px;
  left: -4px;
}

/* 眼睛 */
.pixel-head-inner::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 3px;
  width: 16px;
  height: 4px;
  background: linear-gradient(to right, #333 4px, transparent 4px, transparent 8px, #333 8px, #333 12px);
}

/* 颈部 */
.pixel-neck {
  width: 10px;
  height: 4px;
  background-color: #f5c89a;
  border-left: 1px solid #c8855a;
  border-right: 1px solid #c8855a;
}

.pixel-character[data-gender='female'] .pixel-neck {
  background-color: #f7d4b0;
}

/* 身体 */
.pixel-body {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.pixel-torso {
  width: 26px;
  height: 30px;
  background-color: #4a7fb5;
  border: 2px solid #2d5a8a;
  border-radius: 1px;
}

.pixel-character[data-gender='female'] .pixel-torso {
  background-color: #b54a7f;
  border-color: #8a2d5a;
}

.pixel-arm {
  width: 8px;
  height: 26px;
  background-color: #4a7fb5;
  border: 1px solid #2d5a8a;
  margin-top: 2px;
}

.pixel-character[data-gender='female'] .pixel-arm {
  background-color: #b54a7f;
  border-color: #8a2d5a;
}

.pixel-arm.left {
  border-radius: 2px 0 0 2px;
}

.pixel-arm.right {
  border-radius: 0 2px 2px 0;
}

/* 腿 */
.pixel-legs {
  display: flex;
  gap: 2px;
  margin-top: 1px;
}

.pixel-leg {
  width: 11px;
  height: 22px;
  background-color: #3d3d8a;
  border: 1px solid #222266;
  border-radius: 1px;
}

.pixel-character[data-gender='female'] .pixel-leg {
  background-color: #6b3d8a;
  border-color: #442266;
}

/* 脚 */
.pixel-feet {
  display: flex;
  gap: 2px;
  margin-top: 1px;
}

.pixel-foot {
  width: 13px;
  height: 6px;
  background-color: #5a3a1a;
  border: 1px solid #3a1a00;
  border-radius: 1px 1px 2px 2px;
}

.slot-card {
  border: 1px dashed rgba(72, 100, 145, 0.3);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  background: rgba(255, 255, 255, 0.4);
  transition: border-color 0.2s;
}

.slot-card.slot-equipped {
  border-style: solid;
  border-color: rgba(72, 100, 145, 0.5);
  background: rgba(255, 255, 255, 0.6);
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.2rem;
}

.slot-icon-bg {
  font-size: 0.85rem;
}

.slot-label {
  font-size: 0.78rem;
  color: #7a95b8;
  font-weight: 600;
}

.slot-item-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.2rem;
}

.slot-item-icon {
  font-size: 1rem;
}

.slot-item-name {
  font-size: 0.85rem;
  color: #333;
}

.slot-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.2rem;
}

.slot-empty {
  font-size: 0.78rem;
  color: #bbb;
  text-align: center;
  padding: 0.15rem 0;
}

.slot-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.inv-name {
  font-size: 0.85rem;
  color: #333;
  flex-shrink: 0;
  min-width: 2.5rem;
}

.durability-bar-wrap {
  flex: 1;
  height: 5px;
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
  font-size: 0.72rem;
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-unequip, .btn-equip, .btn-repair {
  font-size: 0.72rem;
  padding: 0.12rem 0.35rem;
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
