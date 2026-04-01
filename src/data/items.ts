export type ItemIcon =
  | { type: 'iconify'; name: string }   // 使用 Iconify 图标库
  | { type: 'svg'; path: string }       // 使用本地 SVG 文件（相对于 src/assets/icons/items/，不含 .svg 后缀）
  | { type: 'text'; char: string }      // fallback：文字或 emoji

export type ItemCategory = 'food' | 'material' | 'equipment'

export type EquipSlot = 'mainHand' | 'head' | 'body' | 'feet' | 'accessory'

export interface EquipStats {
  attack?: number        // 攻击力加成
  defense?: number       // 防御力加成
  gatherSpeed?: number   // 采集速度倍率加成（如 0.5 = +50%）
  miningSpeed?: number   // 采矿速度倍率加成
  energyCostMod?: number // 体力消耗修正（负数 = 减少消耗）
  magicMod?: number      // 魔法值加成
  moodMod?: number       // 心情加成
  hungerMod?: number     // 饥饿消耗修正（负数 = 减少饥饿消耗）
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
    icon: { type: 'svg', path: 'axe' },
    description: '粗糙打磨的石斧，可用于砍伐树木。',
    equipSlot: 'mainHand',
    equipStats: { gatherSpeed: 1.0, attack: 5 }
  },
  sword: {
    id: 'sword',
    name: '木剑',
    category: 'equipment',
    icon: { type: 'svg', path: 'sword' },
    description: '用木头削成的简陋剑，能造成一定伤害。',
    equipSlot: 'mainHand',
    equipStats: { attack: 10 }
  },
  pickaxe: {
    id: 'pickaxe',
    name: '石镐',
    category: 'equipment',
    icon: { type: 'svg', path: 'pickaxe' },
    description: '用于开采矿石，效率更高。',
    equipSlot: 'mainHand',
    equipStats: { miningSpeed: 1.0, attack: 3 }
  },
  shield: {
    id: 'shield',
    name: '木盾',
    category: 'equipment',
    icon: { type: 'svg', path: 'shield' },
    description: '简单的木制盾牌，穿在身上提供基础防御。',
    equipSlot: 'body',
    equipStats: { defense: 8 }
  },
  raw_meat: {
    id: 'raw_meat',
    name: '生肉',
    category: 'food',
    icon: { type: 'svg', path: 'raw_meat' },
    description: '用陷阱捕获的小动物身上取下的生肉，需要烹饪后食用效果更佳。',
    use: () => ({ energy: 10, satiety: 20, health: -5, mood: -3 })
  },
  fish: {
    id: 'fish',
    name: '鱼',
    category: 'food',
    icon: { type: 'svg', path: 'fish' },
    description: '从河里钓上来的新鲜鱼，富含蛋白质，烹饪后更美味。',
    use: () => ({ energy: 20, satiety: 15, health: 3 })
  },
  rare_fish: {
    id: 'rare_fish',
    name: '稀有鱼',
    category: 'food',
    icon: { type: 'svg', path: 'rare_fish' },
    description: '难得一见的稀有鱼类，味道鲜美，充满生命力。',
    use: () => ({ energy: 35, satiety: 25, health: 10, mood: 15 })
  },
  clay: {
    id: 'clay',
    name: '黏土',
    category: 'material',
    icon: { type: 'svg', path: 'clay' },
    description: '河边挖出的湿润黏土，可用于制作陶器和建筑材料。',
  },
  stone: {
    id: 'stone',
    name: '石头',
    category: 'material',
    icon: { type: 'svg', path: 'stone' },
    description: '普通的石块，是建造石制建筑的基础材料。',
  },
  herb: {
    id: 'herb',
    name: '草药',
    category: 'material',
    icon: { type: 'svg', path: 'herb' },
    description: '河边采集的野生草药，可用来制作药品，也可直接使用略微恢复健康。',
    use: () => ({ health: 8, mood: 3 })
  },
  herb_pack: {
    id: 'herb_pack',
    name: '草药包',
    category: 'material',
    icon: { type: 'svg', path: 'herb_pack' },
    description: '用多株草药加工而成的草药包，药效更强，便于携带。',
    use: () => ({ health: 25, mood: 5 })
  },
  iron_ore: {
    id: 'iron_ore',
    name: '铁矿石',
    category: 'material',
    icon: { type: 'svg', path: 'iron_ore' },
    description: '山洞深处挖出的铁矿石，冶炼后可打造更好的工具和装备。',
  },
  crystal: {
    id: 'crystal',
    name: '水晶',
    category: 'material',
    icon: { type: 'svg', path: 'crystal' },
    description: '闪闪发光的神秘水晶，蕴含魔法能量，用途未知。',
  },
  coal: {
    id: 'coal',
    name: '煤炭',
    category: 'material',
    icon: { type: 'svg', path: 'coal' },
    description: '黑色的燃料矿物，是冶炼金属的必要燃料。',
  },
  bone: {
    id: 'bone',
    name: '骨头',
    category: 'material',
    icon: { type: 'svg', path: 'bone' },
    description: '洞穴中发现的骨头，来历不明，也许可以制作某些道具。',
  },
  iron_ingot: {
    id: 'iron_ingot',
    name: '铁锭',
    category: 'material',
    icon: { type: 'svg', path: 'iron_ingot' },
    description: '由铁矿石冶炼而成的铁锭，可以制作高级工具和装备。',
  },
  vegetable: {
    id: 'vegetable',
    name: '蔬菜',
    category: 'food',
    icon: { type: 'svg', path: 'vegetable' },
    description: '自己在农田里种出的新鲜蔬菜，营养均衡。',
    use: () => ({ energy: 15, satiety: 20, health: 5, mood: 5 })
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: '熟肉',
    category: 'food',
    icon: { type: 'svg', path: 'cooked_meat' },
    description: '经过烹饪的肉食，美味可口，比生肉更加安全健康。',
    use: () => ({ energy: 30, satiety: 35, health: 10, mood: 5 })
  },
  first_aid: {
    id: 'first_aid',
    name: '急救包',
    category: 'material',
    icon: { type: 'svg', path: 'first_aid' },
    description: '由草药制成的急救包，紧急时刻可以快速恢复健康。',
    use: () => ({ health: 40, energy: 10 })
  },
  nourishing_soup: {
    id: 'nourishing_soup',
    name: '滋补汤',
    category: 'food',
    icon: { type: 'svg', path: 'nourishing_soup' },
    description: '用蔬菜和肉炖成的滋补汤，能全面补充体力和精神。',
    use: () => ({ health: 20, energy: 40, satiety: 40, mood: 15 })
  },
  grass: {
    id: 'grass',
    name: '草',
    category: 'material',
    icon: { type: 'svg', path: 'grass' },
    description: '随处可见的普通草，是制作火把的必要材料，树林和草地都有分布。',
  },
  torch: {
    id: 'torch',
    name: '火把',
    category: 'equipment',
    icon: { type: 'svg', path: 'torch' },
    description: '用树枝和草制成的简易火把，可以驱赶夜间野兽。装备后能防止夜晚野兽袭击。',
    equipSlot: 'accessory',
    equipStats: { moodMod: 5 }
  },
  lotus_root: {
    id: 'lotus_root',
    name: '莲藕',
    category: 'food',
    icon: { type: 'svg', path: 'lotus_root' },
    description: '湖中采到的新鲜莲藕，清脆爽口，营养丰富。',
    use: () => ({ energy: 15, satiety: 20, health: 5 })
  },
  shellfish: {
    id: 'shellfish',
    name: '贝类',
    category: 'food',
    icon: { type: 'svg', path: 'shellfish' },
    description: '海边捡到的新鲜贝类，富含蛋白质，味道鲜美。',
    use: () => ({ energy: 15, satiety: 20, health: 3 })
  },
  seaweed: {
    id: 'seaweed',
    name: '海藻',
    category: 'material',
    icon: { type: 'svg', path: 'seaweed' },
    description: '海边采集的海藻，可以用来制作食物或药品。',
    use: () => ({ satiety: 5, health: 2 })
  }
}
