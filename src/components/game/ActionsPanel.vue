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

    <!-- 空闲中 -->
    <div v-else class="idle-state">
      <span class="idle-label">💤 空闲中，什么都没做</span>
      <button class="select-action-btn" @click="showActionModal = true">选择行动 →</button>
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
                :class="{ 'is-disabled': !!action.disabled }"
              >
                <span class="modal-action-icon">{{ action.icon || '▶' }}</span>
                <div class="modal-action-info">
                  <span class="modal-action-text">{{ action.text }}</span>
                  <span v-if="action.tooltip && action.disabled" class="modal-action-condition">{{ action.tooltip }}</span>
                </div>
                <button
                  class="modal-select-btn"
                  :disabled="!!action.disabled"
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
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { useScenesStore } from '../../stores/scenes'
import { useActivityStore } from '../../stores/activity'
import { toast } from '../../utils/toast'
import type { GameAction } from '../../stores/scenes/types'

const character = useCharacterStore();
const scenes = useScenesStore();
const activity = useActivityStore();
const showActionModal = ref(false);
const progress = ref(0);

let progressTimer: ReturnType<typeof setInterval> | null = null;
let completing = false;

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
  if (activity.isBusy || action.disabled) return;

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

function cancelActivity() {
  activity.cancelActivity();
  progress.value = 0;
}
</script>

<style scoped>
.actions-panel {
  border-radius: 8px;
  flex: 1;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 空闲状态 */
.idle-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.idle-label {
  font-size: 0.9rem;
  color: #4a5568;
  text-align: center;
}

.select-action-btn {
  padding: 0.5rem;
  border: 1px solid #4a5568;
  border-radius: 4px;
  background: #edf2f7;
  color: #2d3748;
  cursor: pointer;
  font-size: 0.9rem;
  width: 100%;
  transition: background 0.2s;
}

.select-action-btn:hover {
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

