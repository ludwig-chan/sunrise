<template>
  <section class="actions-panel translucent-white">

    <!-- 执行中：显示当前行动 + 进度条 -->
    <div v-if="activity.currentActivity" class="current-activity">
      <div class="current-activity-header">
        <span class="current-activity-icon">{{ activity.currentActivity.icon }}</span>
        <span class="current-activity-label">正在{{ activity.currentActivity.label }}...</span>
        <button class="cancel-btn" @click="cancelActivity">取消</button>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: `${Math.floor(progress * 100)}%` }"></div>
        </div>
        <span class="progress-text">{{ Math.floor(progress * 100) }}%</span>
      </div>
    </div>

    <!-- 空闲中：渐进式复合按钮 + 建造按钮 -->
    <div v-else class="idle-buttons">
      <!-- 渐进式复合主按钮 -->
      <div class="action-btn-group" :class="`phase-${phase}`">
        <!-- 左：场景默认动作（探索） -->
        <button
          class="action-btn-segment action-btn-default"
          :class="{ 'is-disabled': defaultAction && isDisabled(defaultAction) }"
          :disabled="defaultAction ? isDisabled(defaultAction) : false"
          @click="defaultAction && handleActionStart(defaultAction)"
        >
          <span v-if="defaultAction">{{ defaultAction.text }}</span>
          <span v-else>探索</span>
        </button>

        <!-- 中：上次使用的操作（阶段三） -->
        <Transition name="btn-slide">
          <button
            v-if="phase >= 3 && lastAction"
            class="action-btn-segment action-btn-last"
            :class="{ 'is-disabled': isDisabled(lastAction) }"
            :disabled="isDisabled(lastAction)"
            @click="handleLastActionClick"
          >
            {{ lastAction.text }}
          </button>
        </Transition>

        <!-- 右：更多（阶段二起） -->
        <Transition name="btn-slide">
          <button
            v-if="phase >= 2"
            class="action-btn-segment action-btn-more"
            @click="showActionModal = true"
            title="更多行动"
          >···</button>
        </Transition>
      </div>
      <!-- 建造 -->
      <button class="action-btn" @click="showBuildModal = true">建造</button>
    </div>

    <!-- 行动选择弹窗 -->
    <Teleport to="body">
      <div v-if="showActionModal" class="action-modal-overlay" @click.self="showActionModal = false">
        <div class="action-modal">
          <div class="action-modal-header">
            <span class="action-modal-title">选择行动</span>
            <button class="action-modal-close" aria-label="关闭弹窗" @click="showActionModal = false">✕</button>
          </div>
          <div class="action-modal-body">

            <!-- 分组展示：人物行动 + 场景基础行动 -->
            <template v-for="group in scenes.currentGroupedActions" :key="group.groupId">
              <div class="action-group-label">{{ group.label }}</div>
              <div
                v-for="action in group.actions"
                :key="action.name"
                class="modal-action-item"
                :class="{ 'is-disabled': isDisabled(action) }"
              >
                <span class="modal-action-icon">{{ action.icon || '▶' }}</span>
                <div class="modal-action-info">
                  <span class="modal-action-text">{{ action.text }}</span>
                  <span v-if="action.tooltip && isDisabled(action)" class="modal-action-condition">{{ action.tooltip }}</span>
                </div>
                <button
                  class="modal-select-btn"
                  :disabled="isDisabled(action)"
                  @click="handleActionStart(action)"
                >
                  选择
                </button>
              </div>
            </template>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- 建造弹窗 -->
    <BuildModal
      :open="showBuildModal"
      :recipes="scenes.currentBuildingRecipes"
      @close="showBuildModal = false"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { useScenesStore } from '../../stores/scenes'
import { useActivityStore } from '../../stores/activity'
import { toast } from '../../utils/toast'
import type { GameAction } from '../../stores/scenes/types'
import BuildModal from './BuildModal.vue'

const character = useCharacterStore();
const scenes = useScenesStore();
const activity = useActivityStore();
const showActionModal = ref(false);
const showBuildModal = ref(false);
const progress = ref(0);

let progressTimer: ReturnType<typeof setInterval> | null = null;
let completing = false;

// 每个场景的默认动作名称
const DEFAULT_ACTION_MAP: Record<string, string> = {
  base: 'explore',
  forest: 'explore',
  river: 'fishInRiver',
  cave: 'gatherCoal'
};

// 当前场景的默认动作
const defaultAction = computed((): GameAction | null => {
  const sceneId = scenes.currentSceneId;
  const defaultName = DEFAULT_ACTION_MAP[sceneId] ?? 'explore';
  const allActions = scenes.currentGroupedActions.flatMap(g => g.actions);
  return (allActions.find(a => a.name === defaultName) as GameAction) ?? null;
});

// 上次使用的操作（从当前场景所有动作中查找）
const lastAction = computed((): GameAction | null => {
  if (!scenes.lastUsedActionName) return null;
  const allActions = scenes.currentGroupedActions.flatMap(g => g.actions);
  return (allActions.find(a => a.name === scenes.lastUsedActionName) as GameAction) ?? null;
});

// 渐进式阶段：
// 1 = 仅探索（游戏初始）
// 2 = 探索(2/3) + 更多(1/3)（解锁树林后）
// 3 = 探索(1/3) + 上次操作(1/3) + 更多(1/3)（使用过更多菜单的功能后）
const phase = computed((): 1 | 2 | 3 => {
  if (!scenes.unlockedScenes.includes('forest')) return 1;
  if (!scenes.lastUsedActionName) return 2;
  return 3;
});

function isDisabled(action: GameAction): boolean {
  if (typeof action.disabled === 'function') return action.disabled();
  return !!action.disabled;
}

function updateProgress() {
  if (!activity.currentActivity) {
    progress.value = 0;
    return;
  }
  const elapsed = Date.now() - activity.currentActivity.startedAt;
  progress.value = Math.min(1, elapsed / activity.currentActivity.duration);
  if (progress.value >= 1 && !completing) {
    completing = true;
    activity.completeActivity().finally(() => {
      completing = false;
      progress.value = 0;
    });
  }
}

onMounted(() => {
  progressTimer = setInterval(updateProgress, 100);
});

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
});

function handleActionStart(action: GameAction) {
  if (activity.isBusy || isDisabled(action)) return;

  if (character.energy < action.energyCost) {
    const messages = [
      '你感到精疲力尽，需要休息一下...',
      '你的双腿像灌了铅一样沉重...',
      '你气喘吁吁，暂时无法继续...',
      '你的手臂已经抬不起来了...',
      '你需要缓一缓，恢复些体力...'
    ];
    toast({
      message: messages[Math.floor(Math.random() * messages.length)],
      type: 'warning'
    });
    return;
  }

  // 若从"更多"弹窗中选择且不是当前场景默认动作，记录为上次使用的操作
  if (showActionModal.value) {
    const defaultName = DEFAULT_ACTION_MAP[scenes.currentSceneId] ?? 'explore';
    if (action.name !== defaultName) {
      scenes.setLastUsedAction(action.name);
    }
  }

  showActionModal.value = false;
  activity.startActivity({
    name: action.name,
    label: action.text,
    icon: action.icon || '▶',
    startedAt: Date.now(),
    duration: action.duration * 1000,
    onComplete: action.handler
  });
}

// 点击中间"上次操作"按钮
function handleLastActionClick() {
  if (!lastAction.value) return;
  if (isDisabled(lastAction.value)) {
    toast({
      message: lastAction.value.tooltip || '该操作当前无法执行',
      type: 'warning'
    });
    return;
  }
  handleActionStart(lastAction.value);
}

function cancelActivity() {
  activity.cancelActivity();
  progress.value = 0;
}
</script>

<style scoped>
.actions-panel {
  border-radius: 8px;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}

/* 空闲状态：两个按钮竖排 */
.idle-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 渐进式复合按钮组 */
.action-btn-group {
  display: flex;
  border: 1px solid #4a5568;
  border-radius: 4px;
  overflow: hidden;
}

/* 通用按钮片段样式 */
.action-btn-segment {
  padding: 0.55rem 0.5rem;
  background: #edf2f7;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3748;
  transition: background 0.2s, flex 0.35s ease;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.action-btn-segment + .action-btn-segment {
  border-left: 1px solid #4a5568;
}

.action-btn-segment:hover:not(:disabled):not(.is-disabled) {
  background: #e2e8f0;
}

.action-btn-segment:disabled,
.action-btn-segment.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 默认动作（探索）按钮 - 宽度随阶段变化 */
.action-btn-default {
  flex: 2;
}

.phase-3 .action-btn-default {
  flex: 1;
}

/* 上次操作按钮 */
.action-btn-last {
  flex: 1;
  background: #e8f4fd;
}

.action-btn-last:hover:not(:disabled):not(.is-disabled) {
  background: #d1ecfb;
}

/* 更多按钮 */
.action-btn-more {
  flex: 1;
  background: #e2e8f0;
  color: #4a5568;
  font-size: 0.85rem;
}

/* 阶段二：更多按钮较窄（1/3），探索较宽（2/3） */
.phase-2 .action-btn-more {
  flex: 1;
}

.action-btn-more:hover {
  background: #cbd5e0;
}

/* 按钮滑入动画 */
.btn-slide-enter-active,
.btn-slide-leave-active {
  transition: flex 0.35s ease, opacity 0.3s ease, max-width 0.35s ease;
  max-width: 999px;
  overflow: hidden;
}

.btn-slide-enter-from,
.btn-slide-leave-to {
  flex: 0 !important;
  max-width: 0;
  opacity: 0;
  padding-left: 0;
  padding-right: 0;
}

.action-btn {
  padding: 0.55rem 0.5rem;
  border: 1px solid #4a5568;
  border-radius: 4px;
  background: #edf2f7;
  color: #2d3748;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
  transition: background 0.2s;
  font-weight: 600;
}

.action-btn:hover {
  background: #e2e8f0;
}

/* 当前行动区 */
.current-activity {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.current-activity-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.current-activity-icon {
  font-size: 1.1rem;
}

.current-activity-label {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3748;
}

.cancel-btn {
  padding: 0.2rem 0.6rem;
  border: 1px solid rgba(255, 100, 100, 0.5);
  border-radius: 4px;
  background: rgba(200, 50, 50, 0.3);
  color: #fc8181;
  cursor: pointer;
  font-size: 0.78rem;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: rgba(200, 50, 50, 0.5);
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f6ad55, #ed8936);
  border-radius: 4px;
  transition: width 0.1s linear;
}

.progress-text {
  font-size: 0.78rem;
  color: #a0aec0;
  min-width: 2.5rem;
  text-align: right;
}

/* 行动选择弹窗 */
.action-modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.action-modal {
  min-width: 320px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  background: #1a202c;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  color: white;
}

.action-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.action-modal-title {
  font-size: 1rem;
  font-weight: 600;
}

.action-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.25rem;
  opacity: 0.7;
}

.action-modal-close:hover {
  opacity: 1;
}

.action-modal-body {
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 280px;
}

/* 分组标签 */
.action-group-label {
  font-size: 0.72rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.4rem;
  margin-bottom: 0.1rem;
  padding-left: 0.1rem;
}

.action-group-label:first-child {
  margin-top: 0;
}

/* 弹窗内行动项 */
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
  min-width: 3.5rem;
}

.modal-select-btn:hover:not(:disabled) {
  background-color: #2d3748;
}

.modal-select-btn:disabled {
  background-color: #2d3748;
  color: #718096;
  cursor: not-allowed;
}
</style>
