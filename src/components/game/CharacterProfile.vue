<template>
  <div class="character-profile">
    <!-- 基本信息部分 -->
    <div class="basic-info">
      <div class="info-group">
        <label>姓名：</label>
        <span>{{ character.name }}</span>
      </div>
      <div class="info-group">
        <label>年龄：</label>
        <span>{{ character.age }}岁</span>
      </div>
      <div class="info-group">
        <label>性别：</label>
        <span>{{ character.gender === 'male' ? '♂ 男' : '♀ 女' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterStore } from '../../stores/character'

const character = useCharacterStore()
</script>

<style scoped>
.character-profile {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.basic-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.1rem;
}

.info-group label {
  color: #666;
  font-weight: 500;
}

.info-group span {
  color: #333;
  font-weight: 600;
}
</style>

