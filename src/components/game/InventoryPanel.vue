<template>
  <div class="inventory-panel translucent-white">
    <!-- 过滤标签栏 -->
    <div class="filter-bar">
      <button
        :class="['filter-btn', { active: isAllActive }]"
        @click="toggleAll"
      >全部</button>
      <button
        v-for="cat in CATEGORIES"
        :key="cat.key"
        :class="['filter-btn', { active: activeCategories.has(cat.key) }]"
        @click="toggleCategory(cat.key)"
      >{{ cat.label }}</button>
    </div>

    <!-- 主体区：左侧格子 + 右侧详情 -->
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

      <!-- 右侧详情面板 -->
      <div v-if="selectedItem" class="detail-panel">
        <div class="detail-icon">
          <ItemIcon :icon="selectedItem.icon" />
        </div>
        <div class="detail-name">{{ selectedItem.name }}</div>
        <div class="detail-count">× {{ selectedItem.count }}</div>
        <div class="detail-desc">{{ selectedItem.description }}</div>
        <button
          v-if="selectedItem.hasUse"
          class="use-btn"
          :disabled="selectedItem.count <= 0"
          @click="useItem(selectedItem)"
        >使用</button>
      </div>
      <div v-else class="detail-placeholder">
        <span>选择物品查看详情</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEquipmentStore } from '../../stores/equipment'
import { useBaseSceneStore } from '../../stores/scenes/base'
import { useForestSceneStore } from '../../stores/scenes/forest'
import { useCharacterStore } from '../../stores/character'
import { ITEM_DEFINITIONS, type ItemIcon as ItemIconType } from '../../data/items'
import ItemIcon from '../common/ItemIcon.vue'

const equipment = useEquipmentStore()
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
}

const CATEGORIES = [
  { key: 'food', label: '食物' },
  { key: 'material', label: '材料' },
  { key: 'equipment', label: '装备' },
] as const

type CategoryKey = typeof CATEGORIES[number]['key']

const activeCategories = ref<Set<CategoryKey>>(new Set())
const selectedItem = ref<DisplayItem | null>(null)

const isAllActive = computed(() => activeCategories.value.size === 0)

function toggleAll() {
  activeCategories.value = new Set()
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

// 构建展示物品列表（资源 + 装备）
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
    })
  }

  // 装备：石斧
  if (equipment.axe.durability > 0) {
    items.push({
      id: 'axe',
      name: '石斧',
      count: equipment.axeCount,
      icon: { type: 'text', char: '🪓' },
      description: `粗糙打磨的石斧，可用于砍伐树木。耐久度：${equipment.axe.durability}`,
      hasUse: false,
      category: 'equipment',
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

.filter-btn {
  padding: 0.25rem 0.6rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.78rem;
  color: #666;
  transition: all 0.15s;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(66, 153, 225, 0.15);
  border-color: #4299e1;
  color: #2b6cb0;
}

.filter-btn.active {
  background: rgba(66, 153, 225, 0.25);
  border-color: #3182ce;
  color: #2b6cb0;
  font-weight: 500;
}

/* 主体布局 */
.inventory-body {
  display: flex;
  gap: 0.6rem;
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

/* 右侧详情面板 */
.detail-panel {
  width: 130px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.5rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow-y: auto;
}

.detail-icon {
  font-size: 2.4rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
}

.detail-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #2d3748;
  text-align: center;
}

.detail-count {
  font-size: 0.75rem;
  color: #718096;
}

.detail-desc {
  font-size: 0.75rem;
  color: #4a5568;
  text-align: center;
  line-height: 1.5;
}

.use-btn {
  margin-top: auto;
  padding: 0.3rem 0.8rem;
  background: rgba(72, 187, 120, 0.8);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
}

.use-btn:hover:not(:disabled) {
  background: rgba(56, 161, 105, 0.9);
}

.use-btn:disabled {
  background: rgba(160, 174, 192, 0.6);
  cursor: not-allowed;
}

.detail-placeholder {
  width: 130px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: #aaa;
  text-align: center;
  padding: 0.4rem;
}

.empty-hint {
  color: #aaa;
  font-size: 0.82rem;
  padding: 0.3rem 0;
  align-self: flex-start;
}
</style>

