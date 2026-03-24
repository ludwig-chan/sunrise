<template>
  <!-- Iconify 图标 -->
  <Icon v-if="icon.type === 'iconify'" :icon="icon.name" class="item-icon-inner" />

  <!-- 本地 SVG（动态导入） -->
  <component v-else-if="icon.type === 'svg'" :is="svgComponent" class="item-icon-inner" />

  <!-- 文字 fallback -->
  <span v-else class="item-icon-text">{{ icon.char }}</span>
</template>

<script setup lang="ts">
import { defineAsyncComponent, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { ItemIcon } from '../../data/items'

const props = defineProps<{
  icon: ItemIcon
}>()

const svgComponent = computed(() => {
  if (props.icon.type !== 'svg') return null
  const path = props.icon.path
  return defineAsyncComponent({
    loader: () => import(`../../assets/icons/items/${path}.svg`),
    errorComponent: { template: '<span class="item-icon-text">📦</span>' },
  })
})
</script>

<style scoped>
.item-icon-inner {
  width: 1em;
  height: 1em;
  display: inline-block;
}

.item-icon-text {
  line-height: 1;
}
</style>
