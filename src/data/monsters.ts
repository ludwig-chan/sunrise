export interface MonsterDrop {
  id: string
  name: string
  minCount: number
  maxCount: number
}

export interface Monster {
  id: string
  name: string
  icon: string
  hp: number
  attackMin: number
  attackMax: number
  drops: MonsterDrop[]
}

export const MONSTERS: Record<string, Monster> = {
  wolf: {
    id: 'wolf',
    name: '野狼',
    icon: '🐺',
    hp: 40,
    attackMin: 8,
    attackMax: 15,
    drops: [
      { id: 'raw_meat', name: '生肉', minCount: 1, maxCount: 2 },
      { id: 'fur', name: '皮毛', minCount: 1, maxCount: 1 }
    ]
  },
  boar: {
    id: 'boar',
    name: '野猪',
    icon: '🐗',
    hp: 60,
    attackMin: 5,
    attackMax: 12,
    drops: [
      { id: 'raw_meat', name: '生肉', minCount: 2, maxCount: 3 },
      { id: 'bone', name: '骨头', minCount: 1, maxCount: 1 }
    ]
  },
  bear: {
    id: 'bear',
    name: '黑熊',
    icon: '🐻',
    hp: 80,
    attackMin: 12,
    attackMax: 20,
    drops: [
      { id: 'raw_meat', name: '生肉', minCount: 3, maxCount: 3 },
      { id: 'fur', name: '皮毛', minCount: 2, maxCount: 2 },
      { id: 'bone', name: '骨头', minCount: 1, maxCount: 1 }
    ]
  },
  snake: {
    id: 'snake',
    name: '毒蛇',
    icon: '🐍',
    hp: 25,
    attackMin: 6,
    attackMax: 10,
    drops: [
      { id: 'herb', name: '草药', minCount: 1, maxCount: 2 }
    ]
  }
}

export const PLAYER_SKILLS = [
  {
    id: 'normal_attack',
    name: '普通攻击',
    damageMin: 8,
    damageMax: 15,
    energyCost: 0,
    icon: '⚔️'
  },
  {
    id: 'power_strike',
    name: '强力一击',
    damageMin: 18,
    damageMax: 25,
    energyCost: 10,
    icon: '💥'
  }
]
