<template>
  <div class="settings-view">
    <PageHeader title="游戏设置" />
    
    <div class="settings-content">
      <div class="settings-section">
        <h2>基本设置</h2>
        <!-- 后续可以添加音效、音量等设置 -->
      </div>
      
      <div class="settings-section danger-zone">
        <h2>危险操作</h2>
        <div class="danger-action">
          <button class="reset-button" @click="handleResetGame">
            重置游戏
          </button>
          <p class="warning-text">此操作将清空所有游戏进度，不可恢复！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showDialog } from '@/utils/dialog'
import { useCharacterStore } from '@/stores/character'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const characterStore = useCharacterStore()

const handleResetGame = async () => {
  const result = await showDialog({
    message: '确定要重置游戏吗？这将清空所有进度，包括：\n- 角色状态\n- 背包物品\n- 游戏记录\n- 所有资源\n\n此操作不可恢复！',
    options: [
      { text: '确认重置', value: 'confirm' },
      { text: '取消', value: 'cancel' }
    ],
    closeOnOverlay: true
  })

  if (result === 'confirm') {
    await characterStore.restartGame()
    router.push('/')
  }
}
</script>

<style scoped>
.settings-view {
  padding: 4rem 2rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.settings-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.settings-section {
  margin-bottom: 2rem;
}

h2 {
  color: #444;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.danger-zone {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.danger-action {
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 1.5rem;
}

.reset-button {
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.reset-button:hover {
  background-color: #c53030;
}

.warning-text {
  color: #e53e3e;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
</style>
