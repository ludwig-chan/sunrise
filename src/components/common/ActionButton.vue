<template>
  <button
    :class="['action-button', { 'cooling-down': isCountingDown }]"
    @click="handleClick"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <div
      v-if="isCountingDown"
      class="cooldown-bar"
      :style="{ width: `${progressPercentage}%` }"
    ></div>
    <div class="tooltip" v-show="showTooltip && tooltip">{{ formatTooltip }}</div>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { useTooltip } from '@/composables/useTooltip';
import { useCountdown } from '@/composables/useCountdown';
import { useTouchEvents } from '@/composables/useTouchEvents';
import { computed } from 'vue';

interface TooltipItem {
  text: string;
  type?: 'normal' | 'warning' | 'error' | 'success';
}

interface StructuredTooltip {
  description?: string;
  requirements?: string[];
  costs?: { label: string; value: string | number; sufficient?: boolean }[];
  warnings?: string[];
}

type TooltipContent = string | string[] | StructuredTooltip;

const props = defineProps<{
  duration?: number;
  disabled?: boolean;
  tooltip?: TooltipContent;
  beforeClick?: () => boolean;
}>(); 

const emit = defineEmits<{
  click: [];
}>();

// 使用组合式函数
const { showTooltip, handleMouseOver, handleMouseLeave } = useTooltip();
const { isCountingDown, progressPercentage, startCountdown } = useCountdown(props.duration || 0);

// 配置触摸事件处理
const { handleTouchStart, handleTouchEnd } = useTouchEvents({
  onLongPress: () => showTooltip.value = true,
  onLongPressEnd: () => showTooltip.value = false,
  onSingleTouch: () => {
    if (isCountingDown.value) {
      return;
    }
    // 在单触事件中也添加 beforeClick 检查
    if (props.beforeClick && !props.beforeClick()) {
      return;
    }
    startCountdown(() => emit('click'));
  }
});

const handleClick = () => {
  if (isCountingDown.value) {
    return;
  }
  
  // 如果提供了 beforeClick 函数，先执行它检查是否可以继续
  if (props.beforeClick) {
    if (!props.beforeClick()) {
      return;
    }
  }
  
  startCountdown(() => emit('click'));
};

const formatTooltip = computed(() => {
  if (!props.tooltip) return '';
  
  // 如果是字符串，直接返回
  if (typeof props.tooltip === 'string') {
    return props.tooltip;
  }
  
  // 如果是字符串数组，用换行符连接
  if (Array.isArray(props.tooltip)) {
    return props.tooltip.join('\n');
  }
  
  // 如果是结构化的 tooltip
  const tooltip = props.tooltip as StructuredTooltip;
  const parts: string[] = [];
  
  // 添加描述
  if (tooltip.description) {
    parts.push(tooltip.description);
  }
  
  // 添加需求条件
  if (tooltip.requirements?.length) {
    parts.push('需要:');
    parts.push(...tooltip.requirements.map(req => `  · ${req}`));
  }
  
  // 添加消耗
  if (tooltip.costs?.length) {
    parts.push('消耗:');
    parts.push(...tooltip.costs.map(cost => {
      const text = `  · ${cost.label}: ${cost.value}`;
      return cost.sufficient === false ? `${text} (不足)` : text;
    }));
  }
  
  // 添加警告
  if (tooltip.warnings?.length) {
    parts.push(...tooltip.warnings.map(warning => `⚠️ ${warning}`));
  }
  
  return parts.join('\n');
});
</script>

<style scoped>
.action-button {
  position: relative;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #4a5568;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  /* overflow: hidden; */
  width: 100%;
  min-height: 44px;
  /* 移动端友好的最小点击区域 */
  touch-action: manipulation;
  /* 优化移动端触摸 */
  user-select: none;
  /* 防止文本选择 */
}

.action-button:hover:not(:disabled) {
  background-color: #2d3748;
  transform: translateY(-1px);
}

.action-button:active:not(:disabled) {
  transform: translateY(0);
}

.action-button:disabled {
  background-color: #718096;
  cursor: not-allowed;
  opacity: 0.7;
}

.cooldown-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: rgba(255, 160, 0, 0.35);
  transition: width 0.1s linear;
}

.cooldown-bar + * {
  position: relative;
  z-index: 1;
}

.tooltip {
  position: absolute;
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  white-space: pre-wrap;
  margin-right: 8px;
  z-index: 10;
  pointer-events: none;
  min-width: 150px;
  line-height: 1.5;
}

.tooltip::after {
  content: '';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent transparent rgba(0, 0, 0, 0.8);
}

.action-button.cooling-down {
  background-color: #4a5568;
  opacity: 0.75;
  cursor: not-allowed;
}

.action-button.cooling-down:hover {
  background-color: #4a5568;
  transform: none;
}
</style>
