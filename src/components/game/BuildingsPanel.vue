<template>
  <section class="buildings-panel translucent-white">

    <!-- 建筑卡片网格 -->
    <div class="buildings-grid">
      <!-- 已建建筑卡片 -->
      <div
        v-for="(building, index) in buildings"
        :key="`${building.type}-${index}`"
        class="building-card-group"
        :class="{
          'building-card-group--damaged': building.type === 'trap' && building.trapDamaged,
          'building-card-group--has-animal': building.type === 'trap' && building.trapAnimal,
          'has-last': !!getLastAction(building)
        }"
      >
        <!-- 主按钮 -->
        <div class="building-card-wrapper">
          <div
            class="building-card"
            role="button"
            tabindex="0"
            @click="openBuildingModal(building)"
            @keydown.enter="openBuildingModal(building)"
          >
            <span class="building-card-name">{{ building.name }}</span>
            <span v-if="building.type === 'trap' && building.trapAnimal" class="building-card-badge">🐾</span>
            <span v-else-if="building.type === 'trap' && building.trapDamaged" class="building-card-badge building-card-badge--warn">⚠️</span>
            <span v-else-if="building.type === 'farmPlot' && building.farmState === 'growing'" class="building-card-badge building-card-badge--grow">🌱</span>
            <span v-else-if="building.type === 'farmPlot' && building.farmState === 'ready'" class="building-card-badge building-card-badge--ready">🌾</span>
          </div>

          <!-- 篝火燃料条 -->
          <div v-if="building.type === 'campfire'" class="building-status-bar" :title="`燃料：${building.fuelValue ?? 0}/${CAMPFIRE_MAX_FUEL}`">
            <div
              class="building-status-fill campfire-fuel"
              :style="{ width: `${Math.min(100, ((building.fuelValue ?? 0) / CAMPFIRE_MAX_FUEL) * 100)}%` }"
              :class="{ 'fuel-full': (building.fuelValue ?? 0) >= CAMPFIRE_MAX_FUEL }"
            />
          </div>

          <!-- 农田生长进度条 -->
          <div v-else-if="building.type === 'farmPlot'" class="building-status-bar" :title="farmBarTitle(building)">
            <div
              class="building-status-fill farm-progress"
              :style="{ width: `${farmProgress(building)}%` }"
              :class="farmBarClass(building)"
            />
          </div>

          <!-- 状态文字 -->
          <div v-if="building.type === 'campfire'" class="building-status-text">
            燃料 {{ building.fuelValue ?? 0 }}/{{ CAMPFIRE_MAX_FUEL }}
          </div>
          <div v-else-if="building.type === 'farmPlot'" class="building-status-text">
            {{ farmBarTitle(building) }}
          </div>
        </div>

        <!-- 上次操作快捷按钮（若有） -->
        <Transition name="btn-slide">
          <div
            v-if="getLastAction(building)"
            class="building-last-action"
            :class="{ 'is-disabled': isLastActionDisabled(building) }"
            role="button"
            tabindex="0"
            :title="getLastAction(building)?.text"
            @click="executeLastAction(building)"
            @keydown.enter="executeLastAction(building)"
          >
            <span class="building-last-action-text">{{ getLastAction(building)?.text }}</span>
          </div>
        </Transition>
      </div>

      <!-- 无建筑时的占位提示 -->
      <div v-if="buildings.length === 0" class="no-buildings">
        暂无建筑
      </div>
    </div>

    <!-- 建筑详情弹窗 -->
    <BuildingModal
      v-if="selectedBuilding"
      :building="selectedBuilding"
      :open="!!selectedBuilding"
      @close="selectedBuilding = null"
    />

  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import BuildingModal from './BuildingModal.vue';
import type { GameBuilding } from '../../stores/scenes/types';
import { useScenesStore } from '../../stores/scenes';
import { useActivityStore } from '../../stores/activity';
import { useBaseSceneStore, CAMPFIRE_FUEL_ITEMS, CAMPFIRE_COOKABLE_ITEMS, CAMPFIRE_MAX_FUEL } from '../../stores/scenes/base';
import { useInventoryStore } from '../../stores/inventory';
import { useCharacterStore } from '../../stores/character';
import { toast } from '../../utils/toast';

defineProps<{
  buildings: GameBuilding[]
}>();

const scenes = useScenesStore();
const activity = useActivityStore();
const baseScene = useBaseSceneStore();
const inventory = useInventoryStore();
const character = useCharacterStore();

const selectedBuilding = ref<GameBuilding | null>(null);

// 用于农田进度条实时刷新
const now = ref(Date.now());
let nowTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  nowTimer = setInterval(() => { now.value = Date.now() }, 1000);
});

onUnmounted(() => {
  if (nowTimer !== null) clearInterval(nowTimer);
});

function openBuildingModal(building: GameBuilding) {
  selectedBuilding.value = building;
}

// 农田进度（0~100）
function farmProgress(building: GameBuilding): number {
  if (building.farmState === 'ready') return 100;
  if (building.farmState === 'growing' && building.farmPlantedAt && building.farmGrowDuration) {
    const pct = ((now.value - building.farmPlantedAt) / building.farmGrowDuration) * 100;
    return Math.min(99, Math.max(0, pct));
  }
  return 0;
}

// 农田进度条的 CSS class
function farmBarClass(building: GameBuilding): string {
  if (building.farmState === 'ready') return 'farm-ready';
  if (building.farmState === 'growing') return 'farm-growing';
  return 'farm-empty';
}

// 农田状态文字
function farmBarTitle(building: GameBuilding): string {
  if (building.farmState === 'ready') return '可收获';
  if (building.farmState === 'growing') return `生长中 ${Math.floor(farmProgress(building))}%`;
  return '空置';
}

function getLastAction(building: GameBuilding) {
  return scenes.lastUsedBuildingActions[building.type] ?? null;
}

function isLastActionDisabled(building: GameBuilding): boolean {
  if (activity.isBusy) return true;
  const last = getLastAction(building);
  if (!last) return true;

  // Special campfire actions
  if (building.type === 'campfire') {
    if (last.name.startsWith('addFuel:')) {
      const fuelId = last.name.slice('addFuel:'.length);
      return inventory.getCount(fuelId) < 1 || (building.fuelValue ?? 0) >= 200;
    }
    if (last.name.startsWith('cook:')) {
      const inputId = last.name.slice('cook:'.length);
      const cookable = CAMPFIRE_COOKABLE_ITEMS.find(c => c.input === inputId);
      return !cookable || inventory.getCount(inputId) < 1 || (building.fuelValue ?? 0) < cookable.fuelCost;
    }
  }

  // Regular building actions
  const actions = scenes.getBuildingActions(building.type);
  const action = actions.find(a => a.name === last.name);
  if (!action) return true;
  if (typeof action.disabled === 'function') return action.disabled();
  return !!action.disabled;
}

function executeLastAction(building: GameBuilding) {
  if (isLastActionDisabled(building)) return;
  const last = getLastAction(building);
  if (!last) return;

  // Special campfire actions
  if (building.type === 'campfire') {
    if (last.name.startsWith('addFuel:')) {
      const fuelId = last.name.slice('addFuel:'.length);
      baseScene.addCampfireFuel(building, fuelId);
      return;
    }
    if (last.name.startsWith('cook:')) {
      const inputId = last.name.slice('cook:'.length);
      const cookable = CAMPFIRE_COOKABLE_ITEMS.find(c => c.input === inputId);
      if (!cookable) return;
      const handler = baseScene.startCampfireCook(building, cookable);
      if (!handler) return;
      activity.startActivity({
        name: `campfire_cook_${cookable.input}`,
        label: `烤制${cookable.inputName}`,
        icon: '🔥',
        startedAt: Date.now(),
        duration: cookable.duration * 1000,
        onComplete: handler
      });
      return;
    }
  }

  // Regular building actions
  const actions = scenes.getBuildingActions(building.type);
  const action = actions.find(a => a.name === last.name);
  if (!action) return;

  if (action.preExecute) {
    if (!action.preExecute()) return;
  } else if (character.energy < action.energyCost) {
    toast({ message: '体力不足，无法执行该操作', type: 'warning' });
    return;
  }

  activity.startActivity({
    name: action.name,
    label: action.text,
    icon: action.icon || '▶',
    startedAt: Date.now(),
    duration: action.duration * 1000,
    onComplete: action.handler
  });
}
</script>

<style scoped>
.buildings-panel {
  border-radius: 8px;
  padding: 0.75rem;
  flex: 1;
}

.buildings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 建筑卡片组（主按钮 + 可选的上次操作按钮） */
.building-card-group {
  display: flex;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
}

.building-card-group--damaged {
  border-color: rgba(252, 129, 74, 0.5);
}

.building-card-group--has-animal {
  border-color: rgba(104, 211, 145, 0.5);
}

/* 主按钮 + 状态条的外层容器 */
.building-card-wrapper {
  display: flex;
  flex-direction: column;
}

.building-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 68px;
  min-height: 48px;
  padding: 0.4rem 0.3rem;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  text-align: center;
  position: relative;
}

.building-card:hover {
  background: rgba(255, 255, 255, 0.22);
}

.building-card-group--damaged .building-card {
  background: rgba(252, 129, 74, 0.06);
}

.building-card-group--has-animal .building-card {
  background: rgba(104, 211, 145, 0.06);
}

.building-card-name {
  font-size: 0.7rem;
  color: #2d3748;
  font-weight: 600;
  line-height: 1.2;
}

.building-card-badge {
  font-size: 0.65rem;
  margin-top: 0.1rem;
  line-height: 1;
}

.building-card-badge--warn {
  filter: hue-rotate(0deg);
}

.building-card-badge--grow {
  color: #48bb78;
}

.building-card-badge--ready {
  color: #f6ad55;
}

/* 状态条轨道 */
.building-status-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 状态条填充 */
.building-status-fill {
  height: 100%;
  border-radius: 0 2px 2px 0;
  transition: width 1s linear;
}

/* 篝火燃料条：橙红渐变，满格绿色 */
.campfire-fuel {
  background: linear-gradient(90deg, #fc8181, #f6ad55);
}

.campfire-fuel.fuel-full {
  background: #48bb78;
}

/* 农田生长条 */
.farm-growing {
  background: #68d391;
}

.farm-ready {
  background: #f6ad55;
}

.farm-empty {
  background: #cbd5e0;
}

/* 状态文字 */
.building-status-text {
  font-size: 0.55rem;
  color: #718096;
  text-align: center;
  padding: 1px 2px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 68px;
}

/* 上次操作快捷按钮 */
.building-last-action {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.5rem;
  min-width: 52px;
  max-width: 80px;
  background: rgba(209, 236, 251, 0.85);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background 0.15s;
}

.building-last-action:hover:not(.is-disabled) {
  background: rgba(177, 219, 243, 0.9);
}

.building-last-action.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.building-last-action-text {
  font-size: 0.62rem;
  color: #2b6cb0;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  word-break: break-all;
}

/* 滑入动画 */
.btn-slide-enter-active,
.btn-slide-leave-active {
  transition: max-width 0.3s ease, opacity 0.25s ease;
  max-width: 100px;
  overflow: hidden;
}

.btn-slide-enter-from,
.btn-slide-leave-to {
  max-width: 0;
  opacity: 0;
  padding-left: 0;
  padding-right: 0;
}

.no-buildings {
  font-size: 0.78rem;
  color: #a0aec0;
  padding: 0.5rem 0.25rem;
}
</style>
