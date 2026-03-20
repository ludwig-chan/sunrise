<template>
  <div class="inventory-panel translucent-white">
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <!-- 装备 Tab -->
      <div v-show="activeTab === 'equipment'" class="tab-pane">
        <div v-if="equipment.axe.durability > 0" class="item-row">
          <span class="item-icon">🪓</span>
          <span class="item-name">石斧</span>
          <span class="item-count">x{{ equipment.axeCount }}</span>
          <div class="item-durability">
            <div
              class="durability-fill"
              :style="{ width: `${overallDurabilityPercent}%`, backgroundColor: axeDurabilityColor }"
            ></div>
          </div>
          <span class="item-detail">{{ equipment.axe.durability }}耐久</span>
        </div>
        <div v-else class="empty-hint">暂无装备</div>
      </div>

      <!-- 材料 Tab -->
      <div v-show="activeTab === 'materials'" class="tab-pane">
        <template v-if="materials.length > 0">
          <div v-for="item in materials" :key="item.id" class="item-row">
            <span class="item-icon">{{ item.icon }}</span>
            <span class="item-name">{{ item.name }}</span>
            <span class="item-count">x{{ item.count }}</span>
          </div>
        </template>
        <div v-else class="empty-hint">暂无材料</div>
      </div>

      <!-- 食物 Tab -->
      <div v-show="activeTab === 'food'" class="tab-pane">
        <template v-if="foods.length > 0">
          <div v-for="item in foods" :key="item.id" class="item-row">
            <span class="item-icon">{{ item.icon }}</span>
            <span class="item-name">{{ item.name }}</span>
            <span class="item-count">x{{ item.count }}</span>
          </div>
        </template>
        <div v-else class="empty-hint">暂无食物</div>
      </div>

      <!-- 设计图 Tab -->
      <div v-show="activeTab === 'blueprints'" class="tab-pane">
        <div class="empty-hint">暂无已解锁设计图</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEquipmentStore } from '../../stores/equipment'
import { useBaseSceneStore } from '../../stores/scenes/base'
import { useForestSceneStore } from '../../stores/scenes/forest'

const equipment = useEquipmentStore()
const baseScene = useBaseSceneStore()
const forestScene = useForestSceneStore()

const activeTab = ref('materials')

const tabs = [
  { key: 'equipment', label: '装备' },
  { key: 'materials', label: '材料' },
  { key: 'food', label: '食物' },
  { key: 'blueprints', label: '设计图' }
]

const MATERIAL_ICONS: Record<string, string> = {
  wood: '🪵',
  ore: '🪨',
  branch: '🌿'
}

const FOOD_ICONS: Record<string, string> = {
  apple: '🍎',
  berry: '🫐'
}

const MATERIAL_TYPES = new Set(['wood', 'ore', 'branch'])
const FOOD_TYPES = new Set(['apple', 'berry'])

// Aggregate resources from all scenes
function aggregateResources(types: Set<string>, iconMap: Record<string, string>) {
  const map = new Map<string, { id: string; name: string; count: number; icon: string }>()

  const allResources = [
    ...baseScene.scene.resources,
    ...forestScene.scene.resources
  ]

  for (const r of allResources) {
    if (!types.has(r.type)) continue
    const existing = map.get(r.id)
    if (existing) {
      existing.count += r.count
    } else {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        count: r.count,
        icon: iconMap[r.type] ?? '📦'
      })
    }
  }

  return Array.from(map.values()).filter(i => i.count > 0)
}

const materials = computed(() => aggregateResources(MATERIAL_TYPES, MATERIAL_ICONS))
const foods = computed(() => aggregateResources(FOOD_TYPES, FOOD_ICONS))

const overallDurabilityPercent = computed(() => {
  const dur = equipment.axe.durability
  return dur > 0 ? (dur % 100 || 100) : 0
})

const axeDurabilityColor = computed(() => {
  const p = overallDurabilityPercent.value
  if (p > 60) return 'rgba(76, 175, 80, 0.8)'
  if (p > 30) return 'rgba(255, 152, 0, 0.8)'
  return 'rgba(244, 67, 54, 0.8)'
})
</script>

<style scoped>
.inventory-panel {
  padding: 0.5rem 0.8rem;
  border-radius: 6px;
}

.tab-header {
  display: flex;
  gap: 0.2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.3rem 0.7rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.82rem;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  color: #2d3748;
  border-bottom-color: #4299e1;
  font-weight: 500;
}

.tab-content {
  min-height: 2.5rem;
}

.tab-pane {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  font-size: 0.82rem;
}

.item-icon {
  font-size: 0.9rem;
}

.item-name {
  color: #333;
  white-space: nowrap;
}

.item-count {
  color: #555;
  font-size: 0.8rem;
}

.item-durability {
  width: 40px;
  height: 6px;
  background-color: #ddd;
  border-radius: 3px;
  overflow: hidden;
}

.durability-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.item-detail {
  color: #888;
  font-size: 0.75rem;
  white-space: nowrap;
}

.empty-hint {
  color: #aaa;
  font-size: 0.82rem;
  padding: 0.3rem 0;
}
</style>
