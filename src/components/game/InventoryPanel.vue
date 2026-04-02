<template>
  <div class="inventory-panel translucent-white">
    <!-- 过滤标签栏 -->
    <FilterBar
      :items="CATEGORIES"
      :model-value="activeCategories"
      @update:model-value="onFilterChange"
      class="inventory-filter-bar"
    />

    <!-- 主体区：格子全宽 -->
    <div class="inventory-body">
      <!-- 物品格子区 -->
      <div class="grid-area">
        <template v-if="filteredItems.length > 0">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            :class="['item-cell', { selected: selectedItem?.id === item.id, 'expiring-soon': item.isExpiringSoon }]"
            @click="selectItem(item)"
          >
            <ItemIcon :icon="item.icon" class="cell-icon" />
            <span v-if="item.count > 1" class="item-badge">{{ item.count }}</span>
            <span v-if="item.isExpiringSoon" class="expiry-warning">⏰</span>
          </div>
        </template>
        <div v-else class="empty-hint">暂无物品</div>
      </div>
    </div>

    <!-- 底部详情抽屉 -->
    <div :class="['detail-drawer', { open: selectedItem !== null }]">
      <div v-if="selectedItem" class="drawer-content">
        <div class="drawer-left">
          <ItemIcon :icon="selectedItem.icon" class="drawer-icon" />
        </div>
        <div class="drawer-middle">
          <div class="drawer-name">{{ selectedItem.name }}</div>
          <div v-if="selectedItem.effect" class="drawer-effect">
            <span v-if="selectedItem.effect.health"><StatusIcon type="health" class="effect-icon" style="color: rgb(220, 53, 69)" /> +{{ selectedItem.effect.health }}</span>
            <span v-if="selectedItem.effect.energy"><StatusIcon type="energy" class="effect-icon" style="color: rgb(0, 123, 255)" /> +{{ selectedItem.effect.energy }}</span>
            <span v-if="selectedItem.effect.satiety"><StatusIcon type="satiety" class="effect-icon" style="color: rgb(255, 153, 0)" /> +{{ selectedItem.effect.satiety }}</span>
            <span v-if="selectedItem.effect.mood"><StatusIcon type="mood" class="effect-icon" style="color: rgb(147, 112, 219)" /> +{{ selectedItem.effect.mood }}</span>
          </div>
          <div class="drawer-desc">{{ selectedItem.description }}</div>
        </div>
        <div class="drawer-right">
          <button class="close-btn" @click="selectedItem = null">✕</button>
          <button
            v-if="selectedItem.hasUse"
            class="use-btn"
            :disabled="selectedItem.count <= 0"
            @click="useItem(selectedItem)"
          >使用</button>
          <button
            class="discard-btn"
            :disabled="selectedItem.count <= 0"
            @click="discardItem(selectedItem)"
          >丢弃</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInventoryStore } from '../../stores/inventory'
import { useCharacterStore } from '../../stores/character'
import { ITEM_DEFINITIONS, type ItemIcon as ItemIconType, type ItemEffect } from '../../data/items'
import ItemIcon from '../common/ItemIcon.vue'
import StatusIcon from '../common/StatusIcon.vue'
import FilterBar from '../common/FilterBar.vue'

const inventoryStore = useInventoryStore()
const characterStore = useCharacterStore()

// 1游戏小时对应的毫秒数
const GAME_HOUR_MS = (5 * 60 * 1000) / 24
// 当剩余保质期不足此比例时显示警告
const EXPIRY_WARNING_THRESHOLD = 0.25

interface DisplayItem {
  id: string
  name: string
  count: number
  icon: ItemIconType
  description: string
  hasUse: boolean
  category: string
  effect?: ItemEffect
  expiresInHours?: number
  acquiredAt?: number
  isExpiringSoon?: boolean
}

const CATEGORIES = [
  { key: 'food', label: '食物' },
  { key: 'material', label: '材料' },
] as const

type CategoryKey = typeof CATEGORIES[number]['key']

const activeCategories = ref<Set<CategoryKey>>(new Set())
const selectedItem = ref<DisplayItem | null>(null)

// 单选：点击标签时只选此分类；若已经只选了它，则清空（显示全部）
function onFilterChange(newValue: Set<string>) {
  activeCategories.value = newValue as Set<CategoryKey>
  selectedItem.value = null
}

// 直接读全局背包构建展示物品列表
const allDisplayItems = computed((): DisplayItem[] => {
  const items: DisplayItem[] = []
  const now = Date.now()

  for (const invItem of inventoryStore.items) {
    if (invItem.count <= 0) continue
    const def = ITEM_DEFINITIONS[invItem.id]
    if (!def) continue

    let isExpiringSoon = false
    if (def.expiresInHours && invItem.acquiredAt) {
      const totalMs = def.expiresInHours * GAME_HOUR_MS
      const elapsed = now - invItem.acquiredAt
      const remaining = totalMs - elapsed
      // 剩余不到 EXPIRY_WARNING_THRESHOLD 时显示警告
      isExpiringSoon = remaining > 0 && remaining < totalMs * EXPIRY_WARNING_THRESHOLD
    }

    items.push({
      id: invItem.id,
      name: def.name,
      count: invItem.count,
      icon: def.icon,
      description: def.description,
      hasUse: !!def.use,
      category: def.category,
      effect: def.use ? def.use() : undefined,
      expiresInHours: def.expiresInHours,
      acquiredAt: invItem.acquiredAt,
      isExpiringSoon,
    })
  }

  return items
})

const filteredItems = computed(() => {
  if (activeCategories.value.size === 0) return allDisplayItems.value
  return allDisplayItems.value.filter(i => activeCategories.value.has(i.category as CategoryKey))
})

function selectItem(item: DisplayItem) {
  if (selectedItem.value?.id === item.id) {
    selectedItem.value = null
  } else {
    selectedItem.value = item
  }
}

function useItem(item: DisplayItem) {
  characterStore.eatFood(item.id)
  // 使用后若该物品已耗尽，自动关闭详情面板
  if (inventoryStore.getCount(item.id) <= 0) {
    selectedItem.value = null
  }
}

function discardItem(item: DisplayItem) {
  inventoryStore.removeItem(item.id, item.count)
  selectedItem.value = null
}
</script>

<style scoped>
.inventory-panel {
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 过滤标签栏：固定在顶部 */
.inventory-filter-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
  padding-bottom: 0.3rem;
  flex-shrink: 0;
}

/* 主体布局 */
.inventory-body {
  display: flex;
  height: 160px;
  overflow: hidden;
}

/* 格子区 */
.grid-area {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-content: flex-start;
  overflow-y: auto;
}

.item-cell {
  position: relative;
  width: 48px;
  aspect-ratio: 1 / 1;
  background: rgba(255, 255, 255, 0.4);
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: border-color 0.15s, background 0.15s;
}

.item-cell:hover {
  border-color: #4299e1;
  background: rgba(66, 153, 225, 0.1);
}

.item-cell.selected {
  border-color: #3182ce;
  background: rgba(49, 130, 206, 0.15);
  box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.25);
}

.cell-icon {
  font-size: 1.5rem;
  width: 1.5rem;
  height: 1.5rem;
}

.item-cell.expiring-soon {
  border-color: rgba(237, 137, 54, 0.7);
  background: rgba(237, 137, 54, 0.08);
}

.expiry-warning {
  position: absolute;
  bottom: 1px;
  left: 2px;
  font-size: 0.55rem;
  line-height: 1;
  pointer-events: none;
}

.item-badge {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 0.6rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 3px;
  padding: 0 2px;
  line-height: 1.4;
  pointer-events: none;
}

/* 底部详情抽屉 */
.detail-drawer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
  border-top: 1px solid transparent;
}

.detail-drawer.open {
  max-height: 150px;
  border-top-color: rgba(0, 0, 0, 0.08);
}

.drawer-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.2rem 0.2rem;
}

.drawer-left {
  flex-shrink: 0;
  font-size: 2rem;
  display: flex;
  align-items: center;
}

.drawer-icon {
  width: 2rem;
  height: 2rem;
}

.drawer-middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.drawer-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #2d3748;
}

.drawer-effect {
  font-size: 0.75rem;
  color: #718096;
  display: flex;
  gap: 0.5rem;
}

.effect-icon {
  width: 0.85rem;
  height: 0.85rem;
  vertical-align: middle;
  display: inline-block;
}

.drawer-desc {
  font-size: 0.72rem;
  color: #4a5568;
  white-space: normal;
  overflow-wrap: break-word;
}

.drawer-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.close-btn {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.1rem 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #666;
}

.use-btn {
  padding: 0.25rem 0.7rem;
  background: rgba(72, 187, 120, 0.8);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.use-btn:hover:not(:disabled) {
  background: rgba(56, 161, 105, 0.9);
}

.use-btn:disabled {
  background: rgba(160, 174, 192, 0.6);
  cursor: not-allowed;
}

.discard-btn {
  padding: 0.25rem 0.7rem;
  background: rgba(245, 101, 101, 0.7);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.discard-btn:hover:not(:disabled) {
  background: rgba(229, 62, 62, 0.85);
}

.discard-btn:disabled {
  background: rgba(160, 174, 192, 0.6);
  cursor: not-allowed;
}

.empty-hint {
  color: #aaa;
  font-size: 0.82rem;
  padding: 0.3rem 0;
  align-self: flex-start;
}
</style>
