export type ItemIcon =
  | { type: 'iconify'; name: string }   // 使用 Iconify 图标库
  | { type: 'svg'; path: string }       // 使用本地 SVG 文件（相对于 src/assets/icons/items/，不含 .svg 后缀）
  | { type: 'text'; char: string }      // fallback：文字或 emoji

export type ItemCategory = 'food' | 'material' | 'equipment'

export type EquipSlot = 'mainHand' | 'offHand' | 'head' | 'body' | 'legs' | 'feet' | 'accessory'

export interface EquipStats {
  attack?: number        // 攻击力加成
  defense?: number       // 防御力加成
  gatherSpeed?: number   // 采集速度倍率加成（如 0.5 = +50%）
  miningSpeed?: number   // 采矿速度倍率加成
  energyCostMod?: number // 体力消耗修正（负数 = 减少消耗）
}

export interface ItemEffect {
  health?: number
  energy?: number
  satiety?: number
  mood?: number
}

export interface ItemDefinition {
  id: string
  name: string
  category: ItemCategory
  icon: ItemIcon
  description: string
  equipSlot?: EquipSlot   // 装备到哪个槽位
  equipStats?: EquipStats // 装备后的属性加成
  use?: () => ItemEffect
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  apple: {
    id: 'apple',
    name: '苹果',
    category: 'food',
    icon: { type: 'svg', path: 'apple' },
    description: '树林里摘的野生苹果，清甜多汁，吃了心情也会好一些。',
    use: () => ({ energy: 30, satiety: 10, health: 5, mood: 8 })
  },
  berry: {
    id: 'berry',
    name: '浆果',
    category: 'food',
    icon: { type: 'svg', path: 'berry' },
    description: '一把酸甜的野生浆果，量不多，但聊胜于无。',
    use: () => ({ energy: 15, satiety: 5, health: 2, mood: 3 })
  },
  wood: {
    id: 'wood',
    name: '木材',
    category: 'material',
    icon: { type: 'svg', path: 'wood' },
    description: '从树林砍下的原木，是建造和制作工具的基础材料。',
  },
  ore: {
    id: 'ore',
    name: '矿石',
    category: 'material',
    icon: { type: 'svg', path: 'ore' },
    description: '从地里挖出的粗糙矿石，打造金属工具不可或缺。',
  },
  branch: {
    id: 'branch',
    name: '树枝',
    category: 'material',
    icon: { type: 'svg', path: 'branch' },
    description: '捡来的细树枝，用途广泛，轻便易得。制作初级工具的必备材料。',
  },
  axe: {
    id: 'axe',
    name: '石斧',
    category: 'equipment',
    icon: { type: 'text', char: '🪓' },
    description: '粗糙打磨的石斧，可用于砍伐树木。',
    equipSlot: 'mainHand',
    equipStats: { gatherSpeed: 1.0, attack: 5 }
  },
  sword: {
    id: 'sword',
    name: '木剑',
    category: 'equipment',
    icon: { type: 'text', char: '⚔️' },
    description: '用木头削成的简陋剑，能造成一定伤害。',
    equipSlot: 'mainHand',
    equipStats: { attack: 10 }
  },
  pickaxe: {
    id: 'pickaxe',
    name: '石镐',
    category: 'equipment',
    icon: { type: 'text', char: '⛏️' },
    description: '用于开采矿石，效率更高。',
    equipSlot: 'mainHand',
    equipStats: { miningSpeed: 1.0, attack: 3 }
  },
  shield: {
    id: 'shield',
    name: '木盾',
    category: 'equipment',
    icon: { type: 'text', char: '🛡️' },
    description: '简单的木制盾牌，提供基础防御。',
    equipSlot: 'offHand',
    equipStats: { defense: 8 }
  }
}
