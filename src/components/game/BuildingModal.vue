<template>
  <Teleport to="body">
    <div v-if="open" class="building-modal-overlay" @click.self="$emit('close')">
      <div class="building-modal">

        <!-- 标题栏 -->
        <div class="building-modal-header">
          <span v-if="building.type === 'trap'" class="building-modal-icon">🪤</span>
          <span class="building-modal-title">{{ building.name }}</span>
          <span class="building-modal-level">Lv.{{ building.level }}</span>
          <button class="building-modal-close" aria-label="关闭" @click="$emit('close')">✕</button>
        </div>

        <div class="building-modal-body">

          <!-- 陷阱专属区块 -->
          <template v-if="building.type === 'trap'">
            <div class="section-title">陷阱状态</div>

            <!-- 有猎物：显示动物信息，提供宰杀/养殖选项 -->
            <div v-if="building.trapAnimal" class="trap-section trap-has-animal">
              <div class="trap-captured-title">捕获到了：{{ building.trapAnimal.name }}</div>
              <div class="trap-yields">
                <span
                  v-for="y in building.trapAnimal.yields"
                  :key="y.id"
                  class="trap-yield-item"
                >{{ y.name }} ×{{ y.count }}</span>
              </div>
              <div class="trap-actions">
                <button class="trap-breed-btn" @click="handleTrapBreed">养殖</button>
                <button class="trap-harvest-btn" @click="handleTrapSlaughter">宰杀</button>
              </div>
            </div>

            <!-- 损坏：提供修复/摧毁选项 -->
            <div v-if="building.trapDamaged" class="trap-section trap-damaged">
              <div class="trap-damaged-title">⚠️ 陷阱已损坏</div>
              <div class="trap-damaged-desc">
                陷阱触发后损坏，需要修复才能继续捕猎
              </div>
              <div class="trap-actions">
                <button class="trap-destroy-btn" @click="handleTrapDestroy">摧毁</button>
                <button class="trap-repair-btn" @click="handleTrapRepair">修复</button>
              </div>
            </div>

            <!-- 运作中：等待触发 -->
            <div v-if="!building.trapAnimal && !building.trapDamaged" class="trap-section trap-empty">
              <div class="trap-working-title">🕐 陷阱运作中</div>
              <div class="trap-working-desc">陷阱正在等待猎物靠近，过段时间后会有结果...</div>
            </div>
          </template>

          <!-- 篝火专属区块 -->
          <template v-else-if="building.type === 'campfire'">
            <!-- 燃料状态 -->
            <div class="section-title">篝火状态</div>
            <div class="campfire-fuel-section">
              <div class="fuel-label">
                <span>🔥 燃料值</span>
                <span class="fuel-value-text">{{ campfireFuel }} / {{ CAMPFIRE_MAX_FUEL }}</span>
              </div>
              <div class="fuel-bar-wrap">
                <div class="fuel-bar-fill" :style="{ width: `${campfireFuelPercent}%` }"></div>
              </div>
              <div v-if="campfireFuel === 0" class="fuel-empty-hint">篝火已熄灭，请添加燃料才能烤制物品</div>
            </div>

            <!-- 添加燃料 -->
            <div class="section-title" style="margin-top: 0.5rem;">操作</div>
            <div class="modal-action-item">
              <span class="modal-action-icon">🪵</span>
              <div class="modal-action-info">
                <span class="modal-action-text">添加燃料</span>
                <span class="modal-action-condition">{{ fuelItemsHint }}</span>
              </div>
              <button class="modal-select-btn" :disabled="activity.isBusy || !canAddFuel" @click="showFuelSelector = true">选择</button>
            </div>

            <!-- 烤制 -->
            <div class="modal-action-item">
              <span class="modal-action-icon">🍖</span>
              <div class="modal-action-info">
                <span class="modal-action-text">烤制物品</span>
                <span v-if="campfireFuel === 0" class="modal-action-condition">燃料不足</span>
                <span v-else-if="!hasCookableItems" class="modal-action-condition">背包中没有可烤物品</span>
              </div>
              <button class="modal-select-btn" :disabled="activity.isBusy || !hasCookableItems" @click="showCookSelector = true">选择</button>
            </div>

            <!-- 取暖 -->
            <div v-for="action in buildingActions" :key="action.name" class="modal-action-item">
              <span class="modal-action-icon">{{ action.icon || '▶' }}</span>
              <div class="modal-action-info">
                <span class="modal-action-text">{{ action.text }}</span>
              </div>
              <button class="modal-select-btn" :disabled="activity.isBusy" @click="handleActionStart(action)">开始</button>
            </div>

            <!-- 燃料选择弹窗 -->
            <div v-if="showFuelSelector" class="sub-selector-overlay" @click.self="showFuelSelector = false">
              <div class="sub-selector">
                <div class="sub-selector-title">选择燃料材料</div>
                <div v-for="item in availableFuelItems" :key="item.id" class="sub-selector-item" @click="handleAddFuel(item.id)">
                  <span>{{ item.name }}</span>
                  <span class="sub-item-count">×{{ item.count }}</span>
                  <span class="sub-item-hint">燃料值 +{{ CAMPFIRE_FUEL_ITEMS[item.id].value }}</span>
                </div>
                <button class="sub-selector-cancel" @click="showFuelSelector = false">取消</button>
              </div>
            </div>

            <!-- 烤制选择弹窗 -->
            <div v-if="showCookSelector" class="sub-selector-overlay" @click.self="showCookSelector = false">
              <div class="sub-selector">
                <div class="sub-selector-title">选择要烤制的物品</div>
                <div v-for="item in availableCookItems" :key="item.input" class="sub-selector-item" @click="handleCookItem(item)">
                  <span>{{ item.inputName }}</span>
                  <span class="sub-item-count">×{{ inventoryStore.getCount(item.input) }}</span>
                  <span class="sub-item-hint">→ {{ item.outputName }}（{{ item.duration }}s，燃料-{{ item.fuelCost }}）</span>
                </div>
                <button class="sub-selector-cancel" @click="showCookSelector = false">取消</button>
              </div>
            </div>
          </template>

          <!-- 非陷阱非篝火：建筑动作列表 -->
          <template v-else>
            <template v-if="buildingActions.length > 0">
              <div class="section-title">可执行的动作</div>
              <div
                v-for="action in buildingActions"
                :key="action.name"
                class="modal-action-item"
                :class="{ 'is-disabled': !!action.disabled }"
              >
                <span class="modal-action-icon">{{ action.icon || '▶' }}</span>
                <div class="modal-action-info">
                  <span class="modal-action-text">{{ action.text }}</span>
                  <span v-if="action.tooltip && action.disabled" class="modal-action-condition">{{ action.tooltip }}</span>
                </div>
                <button
                  class="modal-select-btn"
                  :disabled="activity.isBusy || !!action.disabled"
                  @click="handleActionStart(action)"
                >
                  开始
                </button>
              </div>
            </template>

            <!-- 无动作提示 -->
            <div v-else class="no-actions">
              <span>该建筑暂无可执行动作</span>
            </div>
          </template>

          <!-- 升级区 -->
          <template v-if="upgradeInfo">
            <div class="section-divider"></div>
            <div class="section-title">升级</div>
            <div class="upgrade-section">
              <div class="upgrade-desc">{{ upgradeInfo.description || `升级至 Lv.${upgradeInfo.toLevel}` }}</div>
              <div class="upgrade-cost">消耗：{{ formatCost(upgradeInfo.cost) }}，体力 -{{ upgradeInfo.energyCost }}</div>
              <button
                class="upgrade-btn"
                :disabled="activity.isBusy"
                @click="handleUpgrade"
              >
                升级 → Lv.{{ upgradeInfo.toLevel }}
              </button>
            </div>
          </template>

          <!-- 仓库区 -->
          <template v-if="building.storage">
            <div class="section-divider"></div>
            <div class="section-title">仓库</div>
            <div class="storage-section">
              <div class="storage-capacity">容量：{{ storageUsed }} / {{ building.storage.capacity }}</div>
              <div v-if="storageEntries.length > 0" class="storage-items">
                <div
                  v-for="[itemId, count] in storageEntries"
                  :key="itemId"
                  class="storage-item"
                >
                  <span>{{ itemId }}</span>
                  <span>× {{ count }}</span>
                </div>
              </div>
              <div v-else class="storage-empty">仓库是空的</div>
            </div>
          </template>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useScenesStore } from '../../stores/scenes';
import { useActivityStore } from '../../stores/activity';
import { useCharacterStore } from '../../stores/character';
import { BASE_BUILDING_UPGRADES, CAMPFIRE_MAX_FUEL, CAMPFIRE_FUEL_ITEMS, CAMPFIRE_COOKABLE_ITEMS, useBaseSceneStore } from '../../stores/scenes/base';
import type { CampfireCookable } from '../../stores/scenes/base';
import { useInventoryStore } from '../../stores/inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../../stores/gameLog';
import { useTimeStore } from '../../stores/time';
import type { GameBuilding, GameBuildingAction } from '../../stores/scenes/types';

const props = defineProps<{
  building: GameBuilding;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const scenes = useScenesStore();
const activity = useActivityStore();
const character = useCharacterStore();
const gameLogStore = useGameLogStore();
const timeStore = useTimeStore();
const inventoryStore = useInventoryStore();
const baseScene = useBaseSceneStore();

const showFuelSelector = ref(false);
const showCookSelector = ref(false);

// 篝火燃料相关
const campfireFuel = computed(() => props.building.fuelValue ?? 0);
const campfireFuelPercent = computed(() => Math.round((campfireFuel.value / CAMPFIRE_MAX_FUEL) * 100));

// 背包中可用的燃料物品
const availableFuelItems = computed(() => {
  return Object.keys(CAMPFIRE_FUEL_ITEMS)
    .filter(id => inventoryStore.getCount(id) > 0)
    .map(id => ({ id, name: CAMPFIRE_FUEL_ITEMS[id].name, count: inventoryStore.getCount(id) }));
});

const canAddFuel = computed(() => availableFuelItems.value.length > 0 && campfireFuel.value < CAMPFIRE_MAX_FUEL);

const fuelItemsHint = computed(() => {
  if (!canAddFuel.value) return '背包中没有可用燃料';
  return '树枝(+10) / 木材(+30) / 煤炭(+60)';
});

// 背包中可烤的物品
const availableCookItems = computed(() => {
  return CAMPFIRE_COOKABLE_ITEMS.filter(c => {
    if (c.input === 'diamond') return inventoryStore.getCount(c.input) > 0;
    return inventoryStore.getCount(c.input) > 0 && campfireFuel.value >= c.fuelCost;
  });
});

const hasCookableItems = computed(() => CAMPFIRE_COOKABLE_ITEMS.some(c => inventoryStore.getCount(c.input) > 0));

function handleAddFuel(fuelItemId: string) {
  showFuelSelector.value = false;
  baseScene.addCampfireFuel(props.building, fuelItemId);
}

function handleCookItem(cookable: CampfireCookable) {
  showCookSelector.value = false;
  if (activity.isBusy) return;

  const handler = baseScene.startCampfireCook(props.building, cookable);
  if (!handler) return;

  emit('close');
  activity.startActivity({
    name: `campfire_cook_${cookable.input}`,
    label: `烤制${cookable.inputName}`,
    icon: '🔥',
    startedAt: Date.now(),
    duration: cookable.duration * 1000,
    onComplete: handler
  });
}

// 获取该建筑的可用动作
const buildingActions = computed<GameBuildingAction[]>(() => {
  return scenes.getBuildingActions(props.building.type);
});

// 获取升级信息（取当前等级对应的下一级配方）
const upgradeInfo = computed(() => {
  const upgrades = BASE_BUILDING_UPGRADES[props.building.type];
  if (!upgrades) return null;
  return upgrades.find(u => u.toLevel === props.building.level + 1) ?? null;
});

// 仓库使用量
const storageUsed = computed(() => {
  if (!props.building.storage) return 0;
  return Object.values(props.building.storage.items).reduce((a, b) => a + b, 0);
});

const storageEntries = computed(() => {
  if (!props.building.storage) return [];
  return Object.entries(props.building.storage.items).filter(([, count]) => count > 0);
});

function formatCost(cost: Record<string, number>): string {
  const NAMES: Record<string, string> = {
    wood: '木材', ore: '矿石', branch: '树枝', apple: '苹果'
  };
  return Object.entries(cost)
    .map(([type, count]) => `${NAMES[type] ?? type}×${count}`)
    .join(' + ');
}

function handleActionStart(action: GameBuildingAction) {
  if (activity.isBusy || action.disabled) return;

  if (character.energy < action.energyCost) {
    const messages = [
      '你感到精疲力尽，需要休息一下...',
      '你的双腿像灌了铅一样沉重...',
      '你气喘吁吁，暂时无法继续...'
    ];
    toast({
      message: messages[Math.floor(Math.random() * messages.length)],
      type: 'warning'
    });
    return;
  }

  emit('close');
  activity.startActivity({
    name: action.name,
    label: action.text,
    icon: action.icon || '▶',
    startedAt: Date.now(),
    duration: action.duration * 1000,
    onComplete: action.handler
  });
}

async function handleUpgrade() {
  if (!upgradeInfo.value) return;
  if (activity.isBusy) return;

  emit('close');
  activity.startActivity({
    name: `upgrade_${props.building.type}`,
    label: `升级${props.building.name}`,
    icon: '⬆️',
    startedAt: Date.now(),
    duration: upgradeInfo.value.duration * 1000,
    onComplete: async () => {
      character.energy = Math.max(0, character.energy - (upgradeInfo.value?.energyCost ?? 0));
      await scenes.upgradeBuildingInCurrentScene(props.building.type);
    }
  });
}

// 养殖：保留动物（为未来养殖系统埋下伏笔）
// 注意：trapDamaged 保持 true，猎物处理后需要玩家另行修复陷阱
function handleTrapBreed() {
  if (!props.building.trapAnimal) return;
  const animalName = props.building.trapAnimal.name;
  props.building.trapAnimal = undefined;
  toast({ message: `已将${animalName}留下来养殖（养殖系统将在未来版本中实现）。陷阱需要修复才能继续使用`, type: 'info' });
  gameLogStore.addEntry({
    text: `将${animalName}留下来养殖`,
    type: 'ACTION',
    gameTimestamp: timeStore.timestamp,
    timestamp: Date.now()
  });
}

// 宰杀：获得猎物资源
// 注意：trapDamaged 保持 true，猎物处理后需要玩家另行修复陷阱
function handleTrapSlaughter() {
  if (!props.building.trapAnimal) return;
  const animal = props.building.trapAnimal;

  for (const y of animal.yields) {
    inventoryStore.addItem({ id: y.id, type: y.id, name: y.name }, y.count);
  }

  const yieldsText = animal.yields.map(y => `${y.name}×${y.count}`).join('，');
  const message = `宰杀了${animal.name}，获得：${yieldsText}。陷阱需要修复才能继续使用`;
  toast({ message, type: 'success' });
  gameLogStore.addEntry({
    text: `宰杀了${animal.name}，获得：${yieldsText}`,
    type: 'ITEM',
    gameTimestamp: timeStore.timestamp,
    timestamp: Date.now()
  });

  props.building.trapAnimal = undefined;
}

// 修复陷阱
function handleTrapRepair() {
  scenes.repairTrapInCurrentScene(props.building);
}

// 摧毁陷阱
function handleTrapDestroy() {
  emit('close');
  scenes.destroyTrapInCurrentScene(props.building);
}
</script>

<style scoped>
.building-modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.building-modal {
  min-width: 300px;
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  background: #1a202c;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
}

.building-modal-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.building-modal-icon {
  font-size: 1.3rem;
}

.building-modal-title {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
}

.building-modal-level {
  font-size: 0.8rem;
  color: #f6ad55;
  background: rgba(246, 173, 85, 0.15);
  border: 1px solid rgba(246, 173, 85, 0.4);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
}

.building-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
  padding: 0 0.25rem;
}

.building-modal-close:hover {
  opacity: 1;
}

.building-modal-body {
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-title {
  font-size: 0.78rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
  margin-bottom: 0.15rem;
}

.section-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.no-actions {
  font-size: 0.85rem;
  color: #718096;
  text-align: center;
  padding: 0.75rem 0;
}

/* 动作列表 */
.modal-action-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.modal-action-item.is-disabled {
  opacity: 0.55;
}

.modal-action-icon {
  font-size: 1rem;
  width: 1.4rem;
  text-align: center;
  flex-shrink: 0;
}

.modal-action-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.modal-action-text {
  font-size: 0.9rem;
  color: #e2e8f0;
}

.modal-action-condition {
  font-size: 0.72rem;
  color: #fc8181;
  margin-top: 0.1rem;
}

.modal-select-btn {
  padding: 0.25rem 0.65rem;
  border: none;
  border-radius: 4px;
  background-color: #4a5568;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background-color 0.2s;
  flex-shrink: 0;
  min-width: 3rem;
}

.modal-select-btn:hover:not(:disabled) {
  background-color: #2d3748;
}

.modal-select-btn:disabled {
  background-color: #2d3748;
  color: #718096;
  cursor: not-allowed;
}

/* 升级区 */
.upgrade-section {
  background: rgba(246, 173, 85, 0.08);
  border: 1px solid rgba(246, 173, 85, 0.25);
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.upgrade-desc {
  font-size: 0.85rem;
  color: #e2e8f0;
}

.upgrade-cost {
  font-size: 0.75rem;
  color: #a0aec0;
}

.upgrade-btn {
  margin-top: 0.25rem;
  padding: 0.3rem 0.75rem;
  border: none;
  border-radius: 4px;
  background: rgba(246, 173, 85, 0.3);
  border: 1px solid rgba(246, 173, 85, 0.5);
  color: #f6ad55;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  align-self: flex-start;
  transition: background 0.2s;
}

.upgrade-btn:hover:not(:disabled) {
  background: rgba(246, 173, 85, 0.5);
}

.upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 仓库区 */
.storage-section {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.storage-capacity {
  font-size: 0.8rem;
  color: #a0aec0;
}

.storage-items {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.2rem;
}

.storage-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.storage-empty {
  font-size: 0.8rem;
  color: #718096;
  text-align: center;
  padding: 0.3rem 0;
}

/* 篝火燃料区 */
.campfire-fuel-section {
  background: rgba(255, 165, 0, 0.08);
  border: 1px solid rgba(255, 165, 0, 0.25);
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.fuel-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.fuel-value-text {
  color: #f6ad55;
  font-weight: 600;
}

.fuel-bar-wrap {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.fuel-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #f6ad55, #f97316);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.fuel-empty-hint {
  font-size: 0.75rem;
  color: #fc8181;
}

/* 子选择器弹窗 */
.sub-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.sub-selector {
  background: #1a202c;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 1rem;
  min-width: 280px;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sub-selector-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.2rem;
}

.sub-selector-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #e2e8f0;
  transition: background 0.15s;
}

.sub-selector-item:hover {
  background: rgba(255,255,255,0.12);
}

.sub-item-count {
  font-weight: 600;
  color: #90cdf4;
}

.sub-item-hint {
  font-size: 0.75rem;
  color: #a0aec0;
  margin-left: auto;
}

.sub-selector-cancel {
  margin-top: 0.3rem;
  padding: 0.3rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  color: #a0aec0;
  cursor: pointer;
  font-size: 0.82rem;
}

.sub-selector-cancel:hover {
  background: rgba(255,255,255,0.1);
}

/* 陷阱区 */
.trap-section {
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.trap-empty {
  background: rgba(255, 255, 255, 0.04);
}

.trap-working-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #90cdf4;
}

.trap-working-desc {
  font-size: 0.8rem;
  color: #718096;
}

.trap-has-animal {
  background: rgba(104, 211, 145, 0.08);
  border: 1px solid rgba(104, 211, 145, 0.3);
}

.trap-captured-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #68d391;
}

.trap-yields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #a0aec0;
}

.trap-yield-item {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
}

.trap-damaged {
  background: rgba(252, 129, 74, 0.08);
  border: 1px solid rgba(252, 129, 74, 0.35);
}

.trap-damaged-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fc8181;
}

.trap-damaged-desc {
  font-size: 0.8rem;
  color: #718096;
}

.trap-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.trap-breed-btn,
.trap-harvest-btn,
.trap-repair-btn,
.trap-destroy-btn {
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.trap-breed-btn {
  border: 1px solid rgba(160, 174, 192, 0.5);
  background: rgba(160, 174, 192, 0.1);
  color: #a0aec0;
}

.trap-breed-btn:hover {
  background: rgba(160, 174, 192, 0.25);
}

.trap-harvest-btn {
  border: 1px solid rgba(104, 211, 145, 0.5);
  background: rgba(104, 211, 145, 0.2);
  color: #68d391;
}

.trap-harvest-btn:hover {
  background: rgba(104, 211, 145, 0.35);
}

.trap-repair-btn {
  border: 1px solid rgba(144, 205, 244, 0.5);
  background: rgba(144, 205, 244, 0.15);
  color: #90cdf4;
}

.trap-repair-btn:hover {
  background: rgba(144, 205, 244, 0.3);
}

.trap-destroy-btn {
  border: 1px solid rgba(252, 129, 74, 0.4);
  background: rgba(252, 129, 74, 0.1);
  color: #fc8181;
}

.trap-destroy-btn:hover {
  background: rgba(252, 129, 74, 0.25);
}
</style>
