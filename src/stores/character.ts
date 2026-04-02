import { defineStore } from 'pinia'
import { gameLog, emitter } from '../utils/eventBus'
import { showDialog } from '../utils/dialog'
import { restartGame } from '../utils/gameSystem'
import { toast } from '../utils/toast'
import { ITEM_DEFINITIONS } from '../data/items'
import { useTimeStore } from './time'
import { useInventoryStore } from './inventory'
// 注意：此处引用 base scene 仅在 actions 内部的函数体中使用，不会在模块初始化时产生循环依赖问题
import { useBaseSceneStore } from './scenes/base'

// 挂机安全保护：血量降至此值时自动暂停，防止无人操作时角色死亡
const HEALTH_AUTO_PAUSE_THRESHOLD = 20

// 吃水果时有概率产出种子（水果id → 种子掉落概率）
const FRUIT_SEED_CHANCE: Record<string, number> = {
  apple: 0.4,
  berry: 0.15,
  wild_grape: 0.25,
  wild_pear: 0.35,
}

// 吃水果时产出的种子类型（水果id → 种子itemId）
const FRUIT_SEED_TYPE: Record<string, string> = {
  apple: 'seed_apple',
  berry: 'seed_berry',
  wild_grape: 'seed_wild_grape',
  wild_pear: 'seed_wild_pear',
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
  temperature: number;
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
    mana: 100,
    temperature: 37
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

      // 卫生度消耗：每小时 -1
      if (this.hygiene > 0) {
        this.hygiene = Math.max(0, this.hygiene - 1)
        if (this.hygiene === 0) {
          gameLog({ text: '你脏得连自己都难以忍受，必须去洗澡！', type: 'SYSTEM' })
        } else if (this.hygiene < 30) {
          gameLog({ text: '你已经很久没有洗澡了，浑身散发着异味...', type: 'SYSTEM' })
        }
      }

      // 心情衰减：基础 -1，卫生<30 额外 -2，饱食<20 额外 -1
      let moodDrop = 1
      if (this.hygiene < 30) moodDrop += 2
      if (this.satiety < 20) moodDrop += 1
      if (this.mood > 0) {
        this.mood = Math.max(0, this.mood - moodDrop)
        if (this.mood < 20) {
          gameLog({ text: '你感到十分烦躁，需要做些让自己开心的事...', type: 'SYSTEM' })
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
          emitter.emit('game-auto-paused')
        }
      }

      // 检查是否死亡
      if (this.health === 0) {
        await this.handleDeath()
      }

      // ===== 物品保质期检查 =====
      // 1游戏小时 = 5*60*1000/24 毫秒（游戏速率）
      const GAME_HOUR_MS = (5 * 60 * 1000) / 24
      const now = Date.now()
      const inventory = useInventoryStore()
      const expiredIds: string[] = []
      for (const item of inventory.items) {
        const def = ITEM_DEFINITIONS[item.id]
        if (!def?.expiresInHours || !item.acquiredAt) continue
        const expireAt = item.acquiredAt + def.expiresInHours * GAME_HOUR_MS
        if (now >= expireAt) {
          expiredIds.push(item.id)
        }
      }
      for (const id of expiredIds) {
        const def = ITEM_DEFINITIONS[id]
        inventory.removeItem(id, inventory.getCount(id))
        gameLog({ text: `你的${def?.name ?? id}已经腐烂，被你扔掉了`, type: 'SYSTEM' })
      }

      // ===== 体温逻辑 =====
      if (this.temperature === undefined) this.temperature = 37
      // 自然趋向 37°C
      if (this.temperature > 37) {
        this.temperature = Math.max(37, this.temperature - 0.5)
      } else if (this.temperature < 37) {
        this.temperature = Math.min(37, this.temperature + 0.5)
      }
      // 篝火加温
      const baseScene = useBaseSceneStore()
      const hasCampfire = baseScene.scene.buildings.some(b => b.type === 'campfire')
      if (hasCampfire) {
        this.temperature = Math.min(38, this.temperature + 1)
      }
      // 体温过低影响
      if (this.temperature < 33) {
        this.health = Math.max(0, this.health - 2)
        gameLog({ text: '你已经冻僵了，请赶快取暖！', type: 'SYSTEM' })
      } else if (this.temperature < 35) {
        this.energy = Math.max(0, this.energy - 3)
        gameLog({ text: '你感到寒意袭来，体力流失加快...', type: 'SYSTEM' })
      }
      // 体温过高
      if (this.temperature > 38.5) {
        this.mood = Math.max(0, this.mood - 5)
        gameLog({ text: '你发烧了，感觉很不舒服...', type: 'SYSTEM' })
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

    // 食用背包中的食物
    eatFood(itemId: string) {
      const def = ITEM_DEFINITIONS[itemId]
      if (!def?.use) return

      const inventory = useInventoryStore()
      if (!inventory.hasEnough(itemId, 1)) {
        toast({ message: '没有可以食用的食物', type: 'warning' })
        return
      }

      inventory.removeItem(itemId, 1)

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

      // 吃水果时有概率产出种子
      const seedChance = FRUIT_SEED_CHANCE[itemId]
      if (seedChance !== undefined && Math.random() < seedChance) {
        const seedId = FRUIT_SEED_TYPE[itemId] ?? 'seed'
        inventory.addItem({ id: seedId, type: 'seed', name: '种子' }, 1)
        gameLog({ text: `从${def.name}里取出了一粒种子`, type: 'ITEM' })
      }
    },

    // 重置游戏
    async restartGame() {
      await restartGame()
    }
  },
  
  persist: true
})
