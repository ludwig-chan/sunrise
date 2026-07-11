<template>
  <div
    class="progress-bar"
    :class="{
      'vertical': direction === 'vertical',
      'stat-critical': statusMode && percentage < 25,
      'stat-warning': statusMode && percentage >= 25 && percentage < 50
    }"
  >
    <div 
      class="progress" 
      :style="{ 
        [direction === 'vertical' ? 'height' : 'width']: `${value}%`,
        backgroundColor: getBarColor()
      }"
    ></div>
    <span 
      class="progress-text"
      :style="getTextStyle()"
    >{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

const props = defineProps<{
  value: number
  max?: number
  label?: string
  direction?: 'horizontal' | 'vertical'
  color?: string
  statusMode?: boolean
}>()

const percentage = computed(() => (props.value / (props.max || 100)) * 100)

const getBarColor = () => {
  const opacity = 0.2 + (percentage.value / 100) * 0.8

  if (props.color) {
    const [r, g, b] = props.color.match(/\d+/g) || ['76', '175', '80']
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return `rgba(76, 175, 80, ${opacity})`
}

const getTextStyle = (): CSSProperties => {
  const percentage = (props.value / (props.max || 100)) * 100
  const isVertical = props.direction === 'vertical'
  const direction = isVertical ? 'bottom' : 'right'
  
  // 在垂直模式下，进度条是从下往上增长的，所以渐变的颜色顺序需要反过来
  return {
    background: `linear-gradient(to ${direction}, 
      ${isVertical ? '#000000' : '#ffffff'} ${isVertical ? 100 - percentage : percentage}%, 
      ${isVertical ? '#ffffff' : '#000000'} ${isVertical ? 100 - percentage : percentage}%
    )`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    // WebkitTextFillColor: 'transparent',
    writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
    textOrientation: isVertical ? 'mixed' : 'initial',
    height: isVertical ? '100%' : 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}
</script>

<style scoped>
.progress-bar {
  flex: 1;
  height: 20px;
  background-color: #ddd;
  overflow: hidden;
  position: relative;
}

.progress-bar.vertical {
  width: 20px;
  height: 100px;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  transition: all 0.3s ease;
  position: absolute;
  left: 0;
  top: 0;
}

.vertical .progress {
  width: 100%;
  height: var(--progress-height);
  position: absolute;
  bottom: 0;
  top: auto;
  min-height: 30px;
  min-width: unset;
}

.progress-text {
  font-size: 0.8rem;
  white-space: nowrap;
  position: absolute;
  width: 100%;
  text-align: center;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}

.vertical .progress-text {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: translate(-50%, -50%) rotate(0deg);
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 50%;
  top: 50%;
}

/* 状态警告模式：属性低于50%时黄色边框 */
.stat-warning {
  border: 1px solid rgba(255, 193, 7, 0.6);
  border-radius: 3px;
}

/* 状态危险模式：属性低于25%时红色脉动 */
.stat-critical {
  border: 1px solid rgba(244, 67, 54, 0.8);
  border-radius: 3px;
  animation: critical-pulse 1.5s ease-in-out infinite;
}

@keyframes critical-pulse {
  0%, 100% { box-shadow: 0 0 3px rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 0 10px rgba(244, 67, 54, 0.8); }
}
</style>
