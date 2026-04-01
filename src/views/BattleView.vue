<template>
  <div class="battle-view">
    <!-- Enemy area (top) -->
    <div class="battle-field">
      <div class="enemy-area">
        <div class="entity-card enemy-card">
          <div class="entity-hp-bar">
            <div class="hp-bar-inner enemy-hp" :style="{ width: enemyHpPercent + '%' }"></div>
          </div>
          <div class="entity-info">
            <span class="entity-icon">{{ battleStore.monster?.icon }}</span>
            <span class="entity-name">{{ battleStore.monster?.name }}</span>
            <span class="entity-hp-text">{{ battleStore.monsterHp }} / {{ battleStore.monsterMaxHp }}</span>
          </div>
        </div>
      </div>

      <!-- Player area (bottom) -->
      <div class="player-area">
        <div class="entity-card player-card">
          <div class="entity-info">
            <span class="entity-icon">{{ character.avatar || '👤' }}</span>
            <span class="entity-name">{{ character.name }}</span>
            <span class="entity-hp-text">{{ battleStore.playerHp }} / {{ battleStore.playerMaxHp }}</span>
          </div>
          <div class="entity-hp-bar">
            <div class="hp-bar-inner player-hp" :style="{ width: playerHpPercent + '%' }"></div>
          </div>
          <div class="entity-energy-bar">
            <div class="energy-bar-inner" :style="{ width: playerEnergyPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Battle log -->
    <div class="battle-log" ref="logContainer">
      <div v-for="(line, i) in battleStore.log" :key="i" class="log-line">{{ line }}</div>
    </div>

    <!-- Actions area -->
    <div class="battle-actions">
      <template v-if="battleStore.result === null">
        <div class="turn-indicator">
          <span v-if="battleStore.turn === 'player'">⚔️ 你的回合</span>
          <span v-else>💫 怪物回合...</span>
        </div>
        <div class="skills" v-if="battleStore.turn === 'player'">
          <button
            v-for="skill in skills"
            :key="skill.id"
            class="skill-btn"
            :disabled="skill.energyCost > 0 && battleStore.playerEnergy < skill.energyCost"
            @click="useSkill(skill.id)"
          >
            <span class="skill-icon">{{ skill.icon }}</span>
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-cost" v-if="skill.energyCost > 0">体力 -{{ skill.energyCost }}</span>
          </button>
        </div>
      </template>
      <template v-else>
        <div class="battle-result" :class="battleStore.result === 'win' ? 'win' : 'lose'">
          <span v-if="battleStore.result === 'win'">🎉 胜利！</span>
          <span v-else>💀 失败...</span>
        </div>
        <button class="return-btn" @click="returnToGame">返回</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useBattleStore } from '../stores/battle'
import { useCharacterStore } from '../stores/character'
import { PLAYER_SKILLS } from '../data/monsters'

const router = useRouter()
const battleStore = useBattleStore()
const character = useCharacterStore()
const logContainer = ref<HTMLElement>()

const skills = PLAYER_SKILLS

const enemyHpPercent = computed(() => {
  if (battleStore.monsterMaxHp === 0) return 0
  return Math.max(0, (battleStore.monsterHp / battleStore.monsterMaxHp) * 100)
})

const playerHpPercent = computed(() => {
  return Math.max(0, (battleStore.playerHp / battleStore.playerMaxHp) * 100)
})

const playerEnergyPercent = computed(() => {
  return Math.max(0, battleStore.playerEnergy)
})

function useSkill(skillId: string) {
  battleStore.useSkill(skillId)
}

function returnToGame() {
  battleStore.resetBattle()
  router.push('/')
}

watch(() => battleStore.log.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})

// If no active battle, return home
if (!battleStore.active || !battleStore.monster) {
  router.push('/')
}
</script>

<style scoped>
.battle-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  padding: 1rem;
  gap: 0.75rem;
}

.battle-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.enemy-area {
  display: flex;
  justify-content: flex-end;
  padding-right: 1rem;
}

.player-area {
  display: flex;
  justify-content: flex-start;
  padding-left: 1rem;
}

.entity-card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1rem;
  min-width: 200px;
  max-width: 260px;
  backdrop-filter: blur(4px);
}

.entity-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.entity-icon {
  font-size: 2.5rem;
}

.entity-name {
  font-size: 1rem;
  font-weight: bold;
}

.entity-hp-text {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.7);
  margin-left: auto;
}

.entity-hp-bar {
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.hp-bar-inner {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.enemy-hp {
  background: linear-gradient(90deg, #e53e3e, #fc8181);
}

.player-hp {
  background: linear-gradient(90deg, #38a169, #68d391);
}

.entity-energy-bar {
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}

.energy-bar-inner {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #3182ce, #63b3ed);
  transition: width 0.4s ease;
}

.battle-log {
  background: rgba(0,0,0,0.4);
  border-radius: 8px;
  padding: 0.75rem;
  height: 120px;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.6;
}

.log-line {
  color: rgba(255,255,255,0.85);
}

.log-line:last-child {
  color: #fff;
  font-weight: 500;
}

.battle-actions {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 1rem;
}

.turn-indicator {
  text-align: center;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.7);
  margin-bottom: 0.75rem;
}

.skills {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.skill-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.skill-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.25);
}

.skill-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 1.5rem;
}

.skill-name {
  font-weight: bold;
  font-size: 0.85rem;
}

.skill-cost {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.6);
}

.battle-result {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
}

.battle-result.win {
  color: #68d391;
}

.battle-result.lose {
  color: #fc8181;
}

.return-btn {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.return-btn:hover {
  background: rgba(255,255,255,0.3);
}
</style>
