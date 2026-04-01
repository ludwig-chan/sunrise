import { defineStore } from 'pinia'
import type { Monster } from '../data/monsters'
import { PLAYER_SKILLS } from '../data/monsters'
import { useCharacterStore } from './character'
import { useInventoryStore } from './inventory'
import { useGameLogStore } from './gameLog'
import { useTimeStore } from './time'

export interface BattleState {
  active: boolean
  monster: Monster | null
  playerHp: number
  monsterHp: number
  playerMaxHp: number
  monsterMaxHp: number
  playerEnergy: number
  turn: 'player' | 'monster' | 'end'
  result: 'win' | 'lose' | null
  log: string[]
}

export const useBattleStore = defineStore('battle', {
  state: (): BattleState => ({
    active: false,
    monster: null,
    playerHp: 100,
    monsterHp: 0,
    playerMaxHp: 100,
    monsterMaxHp: 0,
    playerEnergy: 100,
    turn: 'player',
    result: null,
    log: []
  }),

  actions: {
    startBattle(monster: Monster) {
      const character = useCharacterStore()
      this.active = true
      this.monster = monster
      this.playerHp = character.health
      this.playerMaxHp = 100
      this.playerEnergy = character.energy
      this.monsterHp = monster.hp
      this.monsterMaxHp = monster.hp
      this.turn = 'player'
      this.result = null
      this.log = [`遭遇了${monster.name}${monster.icon}，战斗开始！`]
    },

    useSkill(skillId: string): boolean {
      if (this.turn !== 'player' || this.result !== null) return false
      const skill = PLAYER_SKILLS.find(s => s.id === skillId)
      if (!skill) return false
      if (skill.energyCost > 0 && this.playerEnergy < skill.energyCost) return false

      // Player attacks
      if (skill.energyCost > 0) {
        this.playerEnergy = Math.max(0, this.playerEnergy - skill.energyCost)
      }
      const damage = Math.floor(Math.random() * (skill.damageMax - skill.damageMin + 1)) + skill.damageMin
      this.monsterHp = Math.max(0, this.monsterHp - damage)
      this.log.push(`你使用了${skill.name}，造成 ${damage} 点伤害！`)

      if (this.monsterHp <= 0) {
        this.endBattle('win')
        return true
      }

      // Monster counter-attack
      this.turn = 'monster'
      this.monsterCounterAttack()
      return true
    },

    monsterCounterAttack() {
      if (!this.monster) return
      const damage = Math.floor(Math.random() * (this.monster.attackMax - this.monster.attackMin + 1)) + this.monster.attackMin
      this.playerHp = Math.max(0, this.playerHp - damage)
      this.log.push(`${this.monster.name}反击，造成 ${damage} 点伤害！`)

      if (this.playerHp <= 0) {
        this.endBattle('lose')
        return
      }
      this.turn = 'player'
    },

    endBattle(result: 'win' | 'lose') {
      this.result = result
      this.turn = 'end'
      const character = useCharacterStore()
      const gameLogStore = useGameLogStore()
      const timeStore = useTimeStore()

      if (result === 'win' && this.monster) {
        const inventory = useInventoryStore()
        const dropsText: string[] = []
        for (const drop of this.monster.drops) {
          const count = Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1)) + drop.minCount
          inventory.addItem({ id: drop.id, type: drop.id, name: drop.name }, count)
          dropsText.push(`${drop.name} x${count}`)
        }
        const msg = `击败了${this.monster.name}！获得了${dropsText.join('、')}`
        this.log.push(msg)
        gameLogStore.addEntry({ text: msg, type: 'COMBAT', gameTimestamp: timeStore.timestamp, timestamp: Date.now() })
        // Sync player HP
        character.health = Math.max(1, this.playerHp)
        character.energy = Math.max(0, this.playerEnergy)
      } else if (result === 'lose') {
        const msg = `被${this.monster?.name}击败了...`
        this.log.push(msg)
        gameLogStore.addEntry({ text: msg, type: 'COMBAT', gameTimestamp: timeStore.timestamp, timestamp: Date.now() })
        // Sync player HP (character handles death separately)
        character.health = Math.max(0, this.playerHp)
        character.energy = Math.max(0, this.playerEnergy)
      }
    },

    resetBattle() {
      this.active = false
      this.monster = null
      this.playerHp = 100
      this.monsterHp = 0
      this.playerMaxHp = 100
      this.monsterMaxHp = 0
      this.playerEnergy = 100
      this.turn = 'player'
      this.result = null
      this.log = []
    }
  }
})
