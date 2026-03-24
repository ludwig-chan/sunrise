import { defineStore } from 'pinia'
import { gameLog } from '../utils/eventBus'
import { showDialog } from '../utils/dialog'
import { useBaseSceneStore } from './scenes/base'
import { useForestSceneStore } from './scenes/forest'
import { restartGame } from '../utils/gameSystem'
import { toast } from '../utils/toast'
import { ITEM_DEFINITIONS } from '../data/items'
import { useTimeStore } from './time'

// 挂机安全保护：血量降至此值时自动暂停，防止无人操作时角色死亡
const HEALTH_AUTO_PAUSE_THRESHOLD = 20

type Gender = 'male' | 'female'

interface CharacterState {
  name: string;
  avatar: string;
  age: number;
  gender: Gender;
  health: number;
  energy: number;
  satiety: number;
  mood: number;
  hygiene: number;
  mana: number;
}

export const useCharacterStore = defineStore('character', {
  state: (): CharacterState => ({
    name: '无名氏',
    avatar: '👤',
    age: 18,
    gender: 'male',
    health: 100,
    energy: 100,
    satiety: 100,
    mood: 100,
    hygiene: 100,
    mana: 100
  }),

  actions: {
    updateName(newName: string) {
      this.name = newName
    },
    updateAvatar(newAvatar: string) {
      this.avatar = newAvatar
    },
    updateStats(stats: Partial<CharacterState>) {
      Object.assign(this, stats)
    },
    
    // 处理每小时状态变化
    async hourlyUpdate() {
      // 饱食度消耗：每小时 -1
      if (this.satiety > 0) {
        this.satiety = Math.max(0, this.satiety - 1)
        
        // 当饱食度降至0时发出提示
        if (this.satiety === 0) {
          gameLog({
            text: '你感到饥肠辘辘...',
            type: 'SYSTEM'
          })
        }
      }

      // 体力自然恢复/消耗（基于饱食度）
      if (this.satiety === 0) {
        this.energy = Math.max(0, this.energy - 8)
      } else if (this.satiety < 20) {
        this.energy = Math.max(0, this.energy - 3)
      } else if (this.satiety < 50) {
        this.energy = Math.min(100, this.energy + 2)
      } else {
        this.energy = Math.min(100, this.energy + 5)
      }

      // 体力影响健康值
      if (this.energy < 30) {
        // 低体力时降低健康值
        this.health = Math.max(0, this.health - 1)
        
        if (this.health < 20) {
          gameLog({
            text: '你感觉身体非常虚弱，需要休息和补充能量...',
            type: 'SYSTEM'
          })
        }
      } else if (this.energy > 70 && this.health < 100) {
        // 高体力时缓慢恢复健康值
        this.health = Math.min(100, this.health + 1)
      }

      // 挂机安全保护：血量跌至阈值时自动暂停
      if (this.health <= HEALTH_AUTO_PAUSE_THRESHOLD) {
        const timeStore = useTimeStore()
        if (!timeStore.paused) {
          timeStore.pauseGame()
          gameLog({
            text: '你的状态太虚弱了，游戏已自动暂停，请补充食物和休息后继续。',
            type: 'SYSTEM'
          })
        }
      }

      // 检查是否死亡
      if (this.health === 0) {
        await this.handleDeath()
      }
    },

    // 处理角色死亡
    async handleDeath() {
      const result = await showDialog({
        message: '你的角色死亡了...',
        options: [
          { text: '重新开始', value: 'restart' }
        ],
        closeOnOverlay: false,
        allowMultiple: false
      })

      if (result === 'restart') {
        await restartGame()
      }
    },

    // 食用场景资源中的食物
    eatFood(itemId: string) {
      const def = ITEM_DEFINITIONS[itemId]
      if (!def?.use) return

      const allResources = [
        ...useBaseSceneStore().scene.resources,
        ...useForestSceneStore().scene.resources,
      ]
      const resource = allResources.find(r => r.id === itemId)

      if (!resource || resource.count <= 0) {
        toast({ message: '没有可以食用的食物', type: 'warning' })
        return
      }

      resource.count -= 1

      const effect = def.use()

      const prev = { health: this.health, energy: this.energy, satiety: this.satiety, mood: this.mood }

      if (effect.energy !== undefined)  this.energy  = Math.min(100, this.energy  + effect.energy)
      if (effect.satiety !== undefined) this.satiety = Math.min(100, this.satiety + effect.satiety)
      if (effect.health !== undefined)  this.health  = Math.min(100, this.health  + effect.health)
      if (effect.mood !== undefined)    this.mood    = Math.min(100, this.mood    + effect.mood)

      const parts: string[] = []
      if (effect.energy  !== undefined && this.energy  - prev.energy  > 0) parts.push(`体力 +${this.energy  - prev.energy}`)
      if (effect.satiety !== undefined && this.satiety - prev.satiety > 0) parts.push(`饱食 +${this.satiety - prev.satiety}`)
      if (effect.health  !== undefined && this.health  - prev.health  > 0) parts.push(`血量 +${this.health  - prev.health}`)
      if (effect.mood    !== undefined && this.mood    - prev.mood    > 0) parts.push(`心情 +${this.mood    - prev.mood}`)

      const suffix = parts.length > 0 ? `，${parts.join('、')}` : ''
      gameLog({ text: `吃了${def.name}${suffix}`, type: 'SYSTEM' })
    },

    // 重置游戏
    async restartGame() {
      await restartGame()
    }
  },
  
  persist: true
})
