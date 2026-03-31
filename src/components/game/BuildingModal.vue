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
                <button class="trap-release-btn" @click="handleTrapRelease">放生</button>
                <button class="trap-harvest-btn" @click="handleTrapHarvest">收获</button>
              </div>
            </div>
            <div v-else class="trap-section trap-empty">
              陷阱尚未捕获到动物，请稍后查看
            </div>
          </template>

          <!-- 非陷阱：建筑动作列表 -->
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
import { computed } from 'vue';
import { useScenesStore } from '../../stores/scenes';
import { useActivityStore } from '../../stores/activity';
import { useCharacterStore } from '../../stores/character';
import { BASE_BUILDING_UPGRADES } from '../../stores/scenes/base';
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

function handleTrapRelease() {
  if (!props.building.trapAnimal) return;
  const animalName = props.building.trapAnimal.name;
  props.building.trapAnimal = undefined;
  props.building.trapCapturedAt = Date.now();
  toast({ message: `放生了${animalName}，陷阱重新等待捕获`, type: 'info' });
  gameLogStore.addEntry({
    text: `放生了${animalName}`,
    type: 'ACTION',
    gameTimestamp: timeStore.timestamp,
    timestamp: Date.now()
  });
}

function handleTrapHarvest() {
  if (!props.building.trapAnimal) return;
  const animal = props.building.trapAnimal;

  for (const y of animal.yields) {
    inventoryStore.addItem({ id: y.id, type: y.id, name: y.name }, y.count);
  }

  const yieldsText = animal.yields.map(y => `${y.name}×${y.count}`).join('，');
  const message = `收获了${animal.name}的战利品：${yieldsText}`;
  toast({ message, type: 'success' });
  gameLogStore.addEntry({
    text: message,
    type: 'ITEM',
    gameTimestamp: timeStore.timestamp,
    timestamp: Date.now()
  });

  props.building.trapAnimal = undefined;
  props.building.trapCapturedAt = Date.now();
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

/* 陷阱区 */
.trap-section {
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.trap-empty {
  font-size: 0.85rem;
  color: #718096;
  text-align: center;
  padding: 0.75rem 0;
  background: rgba(255, 255, 255, 0.04);
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

.trap-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.trap-release-btn,
.trap-harvest-btn {
  padding: 0.3rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.trap-release-btn {
  border: 1px solid rgba(160, 174, 192, 0.5);
  background: rgba(160, 174, 192, 0.1);
  color: #a0aec0;
}

.trap-release-btn:hover {
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
</style>
