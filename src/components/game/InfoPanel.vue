<template>
  <section class="info-panel translucent-white">
    <div class="inventory">
      <ResourceList :items="items" />
    </div>
  </section>
</template>

<script setup lang="ts">
import ResourceList from "./ResourceList.vue";

interface Item {
  id: string;
  name: string;
  count: number;
}

defineProps<{
  items: Item[];
}>();
</script>

<style scoped>
.info-panel {
  border-radius: 8px;
  flex: 1;
  padding: 0.5rem;
  box-sizing: border-box;
}
</style>
