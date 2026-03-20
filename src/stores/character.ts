import { defineStore } from 'pinia'
import { gameLog, emitter } from '../utils/eventBus'
import { showDialog } from '../utils/dialog'
import { useTimeStore } from './time'
import { useScenesStore } from './scenes'
import { restartGame } from '../utils/gameSystem'
import { toast } from '../utils/toast'

// 食物效果映射（食用后同时恢复体力和饱食度）
const FOOD_EFFECTS: Record<string, { energy: number; satiety: number }> = {
  apple: { energy: 30, satiety: 10 },
  berry: { energy: 15, satiety: 5 }
}

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
      const effects = FOOD_EFFECTS[itemId]
      if (!effects) return

      const scenes = useScenesStore()
      const resource = scenes.currentScene.resources.find(r => r.id === itemId)

      if (!resource || resource.count <= 0) {
        toast({ message: '没有可以食用的食物', type: 'warning' })
        return
      }

      resource.count -= 1

      const prevEnergy = this.energy
      const prevSatiety = this.satiety
      this.energy = Math.min(100, this.energy + effects.energy)
      this.satiety = Math.min(100, this.satiety + effects.satiety)
      const restoredEnergy = this.energy - prevEnergy
      const restoredSatiety = this.satiety - prevSatiety

      const foodNames: Record<string, string> = {
        apple: '苹果',
        berry: '浆果'
      }
      const foodName = foodNames[itemId] ?? resource.name
      gameLog({ text: `吃了一个${foodName}，体力恢复了 ${restoredEnergy} 点，饱食度恢复了 ${restoredSatiety} 点`, type: 'SYSTEM' })
    },

    // 重置游戏
    async restartGame() {
      await restartGame()
    }
  },
  
  persist: true
})
