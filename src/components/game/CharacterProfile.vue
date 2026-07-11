<template>
  <div class="character-profile">
    <!-- 基本信息部分 -->
    <div class="basic-info">
      <div class="info-group">
        <label>姓名：</label>
        <template v-if="editingName">
          <input
            ref="nameInput"
            v-model="nameValue"
            class="name-input"
            maxlength="12"
            @blur="confirmName"
            @keydown.enter="confirmName"
            @keydown.esc="cancelEdit"
          />
        </template>
        <template v-else>
          <span class="name-display" @click="startEdit" title="点击修改姓名">{{ character.name }}</span>
          <button class="edit-btn" @click="startEdit" title="修改姓名">✏️</button>
        </template>
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
import { ref, nextTick } from 'vue'
import { useCharacterStore } from '../../stores/character'

const character = useCharacterStore()

const editingName = ref(false)
const nameValue = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

function startEdit() {
  nameValue.value = character.name
  editingName.value = true
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}

function confirmName() {
  const trimmed = nameValue.value.trim()
  if (trimmed.length > 0) {
    character.updateName(trimmed)
  }
  editingName.value = false
}

function cancelEdit() {
  editingName.value = false
}
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

.name-display {
  color: #333;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 1px dashed #999;
}

.name-display:hover {
  color: #4299e1;
  border-bottom-color: #4299e1;
}

.name-input {
  border: 1px solid #4299e1;
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  width: 120px;
  outline: none;
}

.edit-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  opacity: 0.5;
  line-height: 1;
}

.edit-btn:hover {
  opacity: 1;
}
</style>

