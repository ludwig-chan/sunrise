<template>
  <div class="inventory-panel translucent-white">
    <!-- 过滤标签栏 -->
    <div class="filter-bar">
      <label
        v-for="cat in CATEGORIES"
        :key="cat.key"
        class="filter-label"
        :class="{ active: activeCategories.has(cat.key) }"
        @click.prevent="selectOnlyCategory(cat.key)"
      >
        <input
          type="checkbox"
          :checked="activeCategories.has(cat.key)"
          @click.stop="toggleCategory(cat.key)"
        /> {{ cat.label }}
      </label>
    </div>

    <!-- 主体区：格子全宽 -->
    <div class="inventory-body">
      <!-- 物品格子区 -->
      <div class="grid-area">
        <template v-if="filteredItems.length > 0">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            :class="['item-cell', { selected: selectedItem?.id === item.id }]"
            @click="selectItem(item)"
          >
            <ItemIcon :icon="item.icon" class="cell-icon" />
            <span v-if="item.count > 1" class="item-badge">{{ item.count }}</span>
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
            <span v-if="selectedItem.effect.health"><StatusIcon type="health" class="effect-icon" /> +{{ selectedItem.effect.health }}</span>
            <span v-if="selectedItem.effect.energy"><StatusIcon type="energy" class="effect-icon" /> +{{ selectedItem.effect.energy }}</span>
            <span v-if="selectedItem.effect.satiety"><StatusIcon type="satiety" class="effect-icon" /> +{{ selectedItem.effect.satiety }}</span>
            <span v-if="selectedItem.effect.mood"><StatusIcon type="mood" class="effect-icon" /> +{{ selectedItem.effect.mood }}</span>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBaseSceneStore } from '../../stores/scenes/base'
import { useForestSceneStore } from '../../stores/scenes/forest'
import { useCharacterStore } from '../../stores/character'
import { ITEM_DEFINITIONS, type ItemIcon as ItemIconType, type ItemEffect } from '../../data/items'
import ItemIcon from '../common/ItemIcon.vue'
import StatusIcon from '../common/StatusIcon.vue'

const baseScene = useBaseSceneStore()
const forestScene = useForestSceneStore()
const characterStore = useCharacterStore()

interface DisplayItem {
  id: string
  name: string
  count: number
  icon: ItemIconType
  description: string
  hasUse: boolean
  category: string
  effect?: ItemEffect
}

const CATEGORIES = [
  { key: 'food', label: '食物' },
  { key: 'material', label: '材料' },
] as const

type CategoryKey = typeof CATEGORIES[number]['key']

const activeCategories = ref<Set<CategoryKey>>(new Set())
const selectedItem = ref<DisplayItem | null>(null)

// 单选：点击标签时只选此分类；若已经只选了它，则清空（显示全部）
function selectOnlyCategory(cat: CategoryKey) {
  if (activeCategories.value.size === 1 && activeCategories.value.has(cat)) {
    activeCategories.value = new Set()
  } else {
    activeCategories.value = new Set([cat])
  }
  selectedItem.value = null
}

function toggleCategory(cat: CategoryKey) {
  const next = new Set(activeCategories.value)
  if (next.has(cat)) {
    next.delete(cat)
  } else {
    next.add(cat)
  }
  activeCategories.value = next
  selectedItem.value = null
}

// 聚合所有场景的资源
const aggregatedResources = computed(() => {
  const map = new Map<string, { id: string; name: string; count: number }>()
  const allResources = [
    ...baseScene.scene.resources,
    ...forestScene.scene.resources,
  ]
  for (const r of allResources) {
    const existing = map.get(r.id)
    if (existing) {
      existing.count += r.count
    } else {
      map.set(r.id, { id: r.id, name: r.name, count: r.count })
    }
  }
  return map
})

// 构建展示物品列表（资源）
const allDisplayItems = computed((): DisplayItem[] => {
  const items: DisplayItem[] = []

  // 来自场景的资源
  for (const [id, res] of aggregatedResources.value) {
    if (res.count <= 0) continue
    const def = ITEM_DEFINITIONS[id]
    if (!def) continue
    items.push({
      id,
      name: def.name,
      count: res.count,
      icon: def.icon,
      description: def.description,
      hasUse: !!def.use,
      category: def.category,
      effect: def.use ? def.use() : undefined,
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
}
</script>

<style scoped>
.inventory-panel {
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

/* 过滤标签栏 */
.filter-bar {
  display: flex;
  gap: 0.2rem;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
  padding-bottom: 0.3rem;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #666;
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
}

.filter-label:hover {
  background: rgba(66, 153, 225, 0.15);
  border-color: #4299e1;
  color: #2b6cb0;
}

.filter-label.active {
  background: rgba(66, 153, 225, 0.25);
  border-color: #3182ce;
  color: #2b6cb0;
  font-weight: 500;
}

.filter-label input[type="checkbox"] {
  margin: 0;
}

/* 主体布局 */
.inventory-body {
  display: flex;
  flex: 1;
  min-height: 0;
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

.empty-hint {
  color: #aaa;
  font-size: 0.82rem;
  padding: 0.3rem 0;
  align-self: flex-start;
}
</style>
