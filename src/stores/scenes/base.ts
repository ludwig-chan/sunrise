import { defineStore } from 'pinia';
import type { GameScene, GameAction, GameBuildingRecipe, GameBuildingAction, GameBuildingUpgrade, GameBuilding, TrapAnimal } from './types';
import { useCharacterStore } from '../character';
import { useScenesStore } from '../scenes';
import { useTimeStore } from '../time';
import { useEquipmentStore } from '../equipment';
import { useInventoryStore } from '../inventory';
import { toast } from '../../utils/toast';
import { useGameLogStore } from '../gameLog';
import { emitter } from '../../utils/eventBus';

// 基地可建造的建筑配方
export const BASE_BUILDING_RECIPES: GameBuildingRecipe[] = [
  {
    type: 'campfire',
    name: '篝火',
    description: '提供温暖和光源，可以烹饪食物',
    cost: { branch: 5 },
    duration: 0.5,
    energyCost: 7
  },
  {
    type: 'woodenHut',
    name: '木屋',
    description: '提供庇护所，有了木屋可以睡觉恢复体力',
    cost: { wood: 20, branch: 5 },
    duration: 1.5,
    energyCost: 20
  },
  {
    type: 'workbench',
    name: '工作台',
    description: '可以制作和修理各种工具、装备',
    cost: { wood: 8, ore: 3 },
    duration: 0.5,
    energyCost: 14
  },
  {
    type: 'storageBox',
    name: '储藏箱',
    description: '增加物品储存空间',
    cost: { wood: 10 },
    duration: 0.5,
    energyCost: 10
  },
  {
    type: 'farmPlot',
    name: '农田',
    description: '开垦一块小农田，可以种植简单蔬菜',
    cost: { branch: 3, ore: 2 },
    duration: 1,
    energyCost: 12
  },
  {
    type: 'herbShop',
    name: '药铺',
    description: '用草药制作各种药品，恢复体力和健康',
    cost: { wood: 12, branch: 8 },
    duration: 1,
    energyCost: 15
  },
  {
    type: 'trap',
    name: '陷阱',
    description: '设置陷阱，过一段时间后可能捕获动物',
    cost: { branch: 8, wood: 3 },
    duration: 0.5,
    energyCost: 8
  }
];

// 建筑图标映射
export const BASE_BUILDING_ICONS: Record<string, string> = {
  campfire: '🔥',
  woodenHut: '🏠',
  workbench: '🔨',
  cookingTable: '🍳',
  storageBox: '📦',
  farmPlot: '🌾',
  herbShop: '🏪',
  trap: '🪤'
};

// 建筑升级配方（可选，预留字段）
export const BASE_BUILDING_UPGRADES: Record<string, GameBuildingUpgrade[]> = {
  campfire: [
    {
      toLevel: 2,
      cost: { ore: 5, branch: 10 },
      energyCost: 15,
      duration: 2,
      description: '升级为石炉，可以冶炼矿石'
    }
  ],
  storageBox: [
    {
      toLevel: 2,
      cost: { wood: 15 },
      energyCost: 12,
      duration: 2,
      description: '扩容至200格'
    }
  ],
  trap: [
    {
      toLevel: 2,
      cost: { wood: 5, ore: 2 },
      energyCost: 10,
      duration: 2,
      description: '强化陷阱，可以捕获更大的动物（鹿），获得更多战利品'
    },
    {
      toLevel: 3,
      cost: { wood: 10, ore: 5 },
      energyCost: 15,
      duration: 2,
      description: '精良陷阱，可捕获野猪，收获骨头和更多皮毛'
    }
  ]
};


const RESOURCE_NAMES: { [key: string]: string } = {
  wood: '木材',
  ore: '矿石',
  branch: '树枝',
  apple: '苹果',
  herb: '草药',
  vegetable: '蔬菜',
  raw_meat: '生肉',
  fur: '皮毛',
  bone: '骨头',
  cooked_meat: '熟肉',
  tool: '工具',
  first_aid: '急救包',
  nourishing_soup: '滋补汤',
  grass: '草',
  torch: '火把'
};

// 基地陷阱修复消耗（建造消耗 branch:8 wood:3）
const TRAP_REPAIR_COST: Record<string, number> = { branch: 5 };
// 基地陷阱摧毁回收材料
const TRAP_DESTROY_RETURN: Record<string, number> = { branch: 4 };

// ===== 篝火燃料系统 =====
export const CAMPFIRE_MAX_FUEL = 200;

// 火把每次制作增加的耐久度
const TORCH_DURABILITY_INCREMENT = 100;

// 可添加为燃料的物品及其燃料值
export const CAMPFIRE_FUEL_ITEMS: Record<string, { name: string; value: number }> = {
  branch: { name: '树枝', value: 10 },
  wood: { name: '木材', value: 30 },
  coal: { name: '煤炭', value: 60 }
};

// 篝火可烤物品配置
export interface CampfireCookable {
  input: string;
  inputName: string;
  output: string | null;
  outputName: string;
  duration: number;
  fuelCost: number;
  message: string;
}

export const CAMPFIRE_COOKABLE_ITEMS: CampfireCookable[] = [
  { input: 'raw_meat', inputName: '生肉', output: 'cooked_meat', outputName: '熟肉', duration: 1.5, fuelCost: 10, message: '烤好了一块肉，获得了熟肉' },
  { input: 'fish', inputName: '鱼', output: 'cooked_fish', outputName: '烤鱼', duration: 1.5, fuelCost: 10, message: '烤好了一条鱼，获得了烤鱼' },
  { input: 'wood', inputName: '木材', output: 'coal', outputName: '煤炭', duration: 2, fuelCost: 5, message: '将木材烧制成了煤炭' },
  { input: 'branch', inputName: '树枝', output: 'ash', outputName: '灰烬', duration: 1, fuelCost: 0, message: '树枝被烧成了灰烬' },
  { input: 'clay', inputName: '黏土', output: 'fired_clay', outputName: '陶器', duration: 3, fuelCost: 15, message: '烧制完成，获得了陶器' },
  { input: 'herb', inputName: '草药', output: 'ash', outputName: '灰烬', duration: 1, fuelCost: 5, message: '草药被烤焦了，变成了灰烬' }
];

// 树林解锁保底次数：基地探索最多此次数后必定解锁树林
const FOREST_UNLOCK_PITY_THRESHOLD = 3;
// 每次基地探索时随机提前解锁树林的概率
const FOREST_UNLOCK_CHANCE = 0.5;

// 夜晚野兽袭击概率（无篝火/火把保护时）
const NIGHT_ATTACK_CHANCE = 0.3;

// 定义基地初始库存（基地本身无资源存储，靠探索和采集获取）
const INITIAL_STOCK = {
  wood: {
    current: 0,
    max: 100
  },
  ore: {
    current: 0,
    max: 100
  },
  branch: {
    current: 0,
    max: 100
  }
} as const;

export const useBaseSceneStore = defineStore('baseScene', {
  state: () => ({
    exploreCount: 0,
    lastNightAttackDay: -1,
    _nightAttackListenerRegistered: false,
    scene: {
      id: 'base',
      name: '基地',
      actions: [],
      buildings: [],
      stock: JSON.parse(JSON.stringify(INITIAL_STOCK))
    } as GameScene
  }),

  getters: {
    actions: (state) => state.scene.actions,
    buildingRecipes: (): GameBuildingRecipe[] => BASE_BUILDING_RECIPES
  },

  actions: {
    // 重置场景状态
    reset() {
      // 重置建筑
      this.scene.buildings = []

      // 重置库存到初始状态
      this.scene.stock = JSON.parse(JSON.stringify(INITIAL_STOCK))

      // 重置探索计数
      this.exploreCount = 0
      this.lastNightAttackDay = -1

      // 重置动作列表，然后重新初始化
      this.scene.actions = []
      this.initializeScene()
    },

    // 检查体力值是否足够
    checkEnergy(cost: number): boolean {
      const character = useCharacterStore();
      if (character.energy < cost) {
        toast({
          message: "你太累了,需要休息一下...",
          type: "warning"
        });
        return false;
      }
      return true;
    },

    // 消耗体力值
    consumeEnergy(cost: number) {
      const character = useCharacterStore();
      character.energy = Math.max(0, character.energy - cost);
    },

    // 为动作添加体力值消耗的包装器函数
    async withEnergyCost(cost: number, action: () => Promise<void>): Promise<void> {
      if (!this.checkEnergy(cost)) {
        return;
      }
      await action();
      this.consumeEnergy(cost);
    },

    // 探索基地周边
    // 说明：树林解锁由此处触发；草地、河边等后续场景的解锁
    //       改为依赖各自场景的行为计数，见 forest.ts / grassland.ts 等。
    async explore() {
      const scenes = useScenesStore();

      // 随机事件和发现的处理
      const eventRoll = Math.random();

      if (!scenes.unlockedScenes.includes('forest')) {
        // 树林尚未解锁：保底机制（3次内必解锁，或 50% 概率提前）
        this.exploreCount++;
        if (this.exploreCount >= FOREST_UNLOCK_PITY_THRESHOLD || eventRoll < FOREST_UNLOCK_CHANCE) {
          scenes.unlockScene('forest');
          this.exploreCount = 0;
          const unlockMessage = "在远处发现了一片茂密的树林，看起来那里会有不少资源...";
          toast({ message: unlockMessage, type: 'info' });
          useGameLogStore().addEntry({
            text: unlockMessage,
            type: 'ACTION',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
          });
          return;
        }
      }

      // 树林已解锁后：30% 概率发现少量资源（树枝/矿石/草），其余普通消息
      if (eventRoll < 0.3) {
        const resources = [
          { id: 'branch', name: '树枝' },
          { id: 'ore', name: '矿石' },
          { id: 'grass', name: '草' }
        ];
        const picked = resources[Math.floor(Math.random() * resources.length)];
        const amount = Math.floor(Math.random() * 2) + 1; // 1-2 个

        useInventoryStore().addItem({ id: picked.id, type: picked.id, name: picked.name }, amount);

        const message = `在附近发现了 ${amount} 个${picked.name}！`;
        toast({ message, type: 'success' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ITEM',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      } else {
        const messages = [
          "四周很安静，什么特别的都没有发现。",
          "在附近转了转，风景不错。",
          "周围一切如常。",
          "这个地方好像已经很熟悉了。"
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        toast({ message, type: 'info' });
        useGameLogStore().addEntry({
          text: message,
          type: 'ACTION',
          gameTimestamp: useTimeStore().timestamp,
          timestamp: Date.now()
        });
      }
    },

    // 建造建筑
    async build(recipeType: string) {
      const recipe = BASE_BUILDING_RECIPES.find(r => r.type === recipeType);
      if (!recipe) return;

      // 陷阱允许建造多个，其他建筑只允许建造一个
      if (recipeType !== 'trap' && this.scene.buildings.some(b => b.type === recipeType)) {
        toast({ message: '该建筑已经建好了', type: 'warning' });
        return;
      }

      const inventory = useInventoryStore();

      // 检查材料是否足够
      const missing: string[] = [];
      for (const [resourceType, required] of Object.entries(recipe.cost)) {
        const current = inventory.getCount(resourceType);
        if (current < required) {
          const name = RESOURCE_NAMES[resourceType] ?? resourceType;
          missing.push(`${name} x${required - current}`);
        }
      }

      if (missing.length > 0) {
        toast({ message: `材料不足：还需要 ${missing.join('、')}`, type: 'warning' });
        return;
      }

      // 扣除材料
      for (const [resourceType, required] of Object.entries(recipe.cost)) {
        inventory.removeItem(resourceType, required);
      }

      // 添加建筑（带图标），篝火初始燃料值为 0
      const newBuilding: GameBuilding = {
        name: recipe.name,
        type: recipe.type,
        level: 1,
        icon: BASE_BUILDING_ICONS[recipe.type]
      };
      if (recipe.type === 'campfire') {
        newBuilding.fuelValue = 0;
      }
      this.scene.buildings.push(newBuilding);
      toast({ message: `${recipe.name}建造成功！`, type: 'success' });

      // 建造完成后刷新动作列表
      this.scene.actions = this.getActionConfig();
    },

    // 睡觉：消耗饱食度恢复体力
    async sleep() {
      const character = useCharacterStore();
      const SATIETY_COST = 20;
      const ENERGY_RESTORE = 30;
      if (character.satiety <= SATIETY_COST) {
        toast({ message: '太饿了，睡不着...', type: 'warning' });
        return;
      }
      character.satiety = Math.max(0, character.satiety - SATIETY_COST);
      character.energy = Math.min(100, character.energy + ENERGY_RESTORE);
      const message = `睡了一觉，体力恢复了 +${ENERGY_RESTORE}，饱食度 -${SATIETY_COST}`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 休息：小幅恢复体力（人物动作，随时可用）
    async rest() {
      const character = useCharacterStore();
      const ENERGY_RESTORE = 8;
      character.energy = Math.min(100, character.energy + ENERGY_RESTORE);
      const message = `稍作休息，体力恢复了 +${ENERGY_RESTORE}`;
      toast({ message, type: 'info' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 烤食物（篝火建筑动作）
    async cookFood() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('raw_meat', 1)) {
        toast({ message: '没有生肉可以烤', type: 'warning' });
        return;
      }
      inventory.removeItem('raw_meat', 1);
      inventory.addItem({ id: 'cooked_meat', type: 'cooked_meat', name: '熟肉' }, 1);
      const message = '用篝火烤了一块肉，获得了熟肉';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 取暖过夜（篝火建筑动作）
    async warmUp() {
      const character = useCharacterStore();
      character.mood = Math.min(100, character.mood + 15);
      const message = '在篝火旁取暖，心情好多了 +15';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 向篝火添加燃料
    addCampfireFuel(building: GameBuilding, fuelItemId: string): boolean {
      const inventory = useInventoryStore();
      const fuelDef = CAMPFIRE_FUEL_ITEMS[fuelItemId];
      if (!fuelDef) {
        toast({ message: '该物品不能作为燃料', type: 'warning' });
        return false;
      }
      if (!inventory.hasEnough(fuelItemId, 1)) {
        toast({ message: `背包中没有${fuelDef.name}`, type: 'warning' });
        return false;
      }
      const currentFuel = building.fuelValue ?? 0;
      if (currentFuel >= CAMPFIRE_MAX_FUEL) {
        toast({ message: '篝火燃料已满', type: 'warning' });
        return false;
      }
      inventory.removeItem(fuelItemId, 1);
      building.fuelValue = Math.min(CAMPFIRE_MAX_FUEL, currentFuel + fuelDef.value);
      const message = `向篝火添加了${fuelDef.name}，燃料值 +${fuelDef.value}，当前：${building.fuelValue}/${CAMPFIRE_MAX_FUEL}`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({ text: message, type: 'ITEM', gameTimestamp: useTimeStore().timestamp, timestamp: Date.now() });
      return true;
    },

    // 篝火烤制物品（preExecute 模式：立即消耗材料和燃料，进度条后产出）
    startCampfireCook(building: GameBuilding, cookable: CampfireCookable): (() => Promise<void>) | null {
      const inventory = useInventoryStore();
      const character = useCharacterStore();
      const currentFuel = building.fuelValue ?? 0;

      if (!inventory.hasEnough(cookable.input, 1)) {
        toast({ message: `背包中没有${cookable.inputName}`, type: 'warning' });
        return null;
      }
      if (currentFuel < cookable.fuelCost) {
        toast({ message: '篝火已熄灭，请先添加燃料', type: 'warning' });
        return null;
      }
      if (character.energy < 3) {
        toast({ message: '体力不足，无法烤制', type: 'warning' });
        return null;
      }

      // 立即消耗：材料 + 燃料 + 体力
      inventory.removeItem(cookable.input, 1);
      building.fuelValue = Math.max(0, currentFuel - cookable.fuelCost);
      character.energy = Math.max(0, character.energy - 3);

      // 返回完成回调（进度条结束后调用）
      return async () => {
        if (cookable.output) {
          const outputDef = this.getCookableOutputDef(cookable.output);
          inventory.addItem({ id: cookable.output, type: cookable.output, name: outputDef }, 1);
        }
        toast({ message: cookable.message, type: 'success' });
        useGameLogStore().addEntry({ text: cookable.message, type: 'ITEM', gameTimestamp: useTimeStore().timestamp, timestamp: Date.now() });
      };
    },

    // 获取产出物品名称（辅助方法）
    getCookableOutputDef(outputId: string): string {
      const names: Record<string, string> = {
        cooked_meat: '熟肉', cooked_fish: '烤鱼', coal: '煤炭',
        ash: '灰烬', fired_clay: '陶器'
      };
      return names[outputId] ?? outputId;
    },

    // 制作工具（工作台建筑动作）
    async craftTool() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('wood', 2) || !inventory.hasEnough('ore', 1)) {
        toast({ message: '需要木材×2 + 矿石×1 才能制作工具', type: 'warning' });
        return;
      }
      inventory.removeItem('wood', 2);
      inventory.removeItem('ore', 1);
      inventory.addItem({ id: 'tool', type: 'tool', name: '工具' }, 1);
      const message = '在工作台上制作了一件工具';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 种植蔬菜（农田建筑动作）
    async plantVegetable() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('branch', 1)) {
        toast({ message: '需要树枝 ×1 才能种植蔬菜', type: 'warning' });
        return;
      }
      inventory.removeItem('branch', 1);
      const amount = Math.floor(Math.random() * 2) + 1; // 1-2
      inventory.addItem({ id: 'vegetable', type: 'vegetable', name: '蔬菜' }, amount);
      const message = `在农田里种出了 ${amount} 株蔬菜！`;
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作急救包（药铺建筑动作）
    async makeFirstAid() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('herb', 2)) {
        toast({ message: '需要草药 ×2 才能制作急救包', type: 'warning' });
        return;
      }
      inventory.removeItem('herb', 2);
      inventory.addItem({ id: 'first_aid', type: 'first_aid', name: '急救包' }, 1);
      const message = '用草药制作了 1 个急救包';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作滋补汤（药铺建筑动作）
    async makeNourishingSoup() {
      const inventory = useInventoryStore();
      if (!inventory.hasEnough('vegetable', 2) || !inventory.hasEnough('raw_meat', 1)) {
        toast({ message: '需要蔬菜 ×2 + 生肉 ×1 才能制作滋补汤', type: 'warning' });
        return;
      }
      inventory.removeItem('vegetable', 2);
      inventory.removeItem('raw_meat', 1);
      inventory.addItem({ id: 'nourishing_soup', type: 'nourishing_soup', name: '滋补汤' }, 1);
      const message = '用蔬菜和生肉炖出了 1 碗滋补汤！';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 冥想（人物动作版）：mana +15，mood +10
    async meditateCharacter() {
      const character = useCharacterStore();
      character.mana = Math.min(100, character.mana + 15);
      character.mood = Math.min(100, character.mood + 10);
      const message = '静心冥想，法力和心情都好了不少。法力 +15，心情 +10';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 整理营地（场景行动）：hygiene +10，mood +5
    async tidyCamp() {
      const character = useCharacterStore();
      character.hygiene = Math.min(100, character.hygiene + 10);
      character.mood = Math.min(100, character.mood + 5);
      const message = '营地整洁了许多。卫生度 +10，心情 +5';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 自言自语（人物动作）：mood +5
    async talkToSelf() {
      const character = useCharacterStore();
      character.mood = Math.min(100, character.mood + 5);
      const message = '自言自语了一阵子，感觉好多了。心情 +5';
      toast({ message, type: 'info' });
      useGameLogStore().addEntry({
        text: message,
        type: 'SYSTEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 制作火把：消耗 树枝×1 + 草×2，火把直接进入装备系统（不占背包）
    async craftTorch() {
      const inventory = useInventoryStore();
      const equipment = useEquipmentStore();
      if (!inventory.hasEnough('branch', 1) || !inventory.hasEnough('grass', 2)) {
        toast({ message: '需要树枝 ×1 + 草 ×2 才能制作火把', type: 'warning' });
        return;
      }
      inventory.removeItem('branch', 1);
      inventory.removeItem('grass', 2);
      this.addTorchDurability(equipment);
      const message = '用树枝和草制作了一个火把，可在装备页面装备到饰品槽';
      toast({ message, type: 'success' });
      useGameLogStore().addEntry({
        text: message,
        type: 'ITEM',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 向装备库存增加火把耐久度（辅助方法）
    addTorchDurability(equipment: ReturnType<typeof useEquipmentStore>) {
      if (!equipment.inventory.torch) {
        equipment.inventory.torch = { durability: 0, maxDurability: TORCH_DURABILITY_INCREMENT };
      }
      equipment.inventory.torch.durability = Math.min(
        equipment.inventory.torch.maxDurability,
        equipment.inventory.torch.durability + TORCH_DURABILITY_INCREMENT
      );
    },

    // 获取人物动作（与场景/建筑无关）
    getCharacterActions(): GameBuildingAction[] {
      const inventory = useInventoryStore();
      const equipment = useEquipmentStore();
      const character = useCharacterStore();
      return [
        {
          name: 'rest',
          text: '休息',
          icon: '💤',
          duration: 1,
          energyCost: 0,
          actionGroup: 'character',
          handler: async () => await this.rest()
        },
        {
          name: 'meditate',
          text: '冥想',
          icon: '🧘',
          duration: 1,
          energyCost: 0,
          actionGroup: 'character',
          handler: async () => await this.meditateCharacter()
        },
        {
          name: 'talkToSelf',
          text: '自言自语',
          icon: '💬',
          duration: 0.5,
          energyCost: 0,
          actionGroup: 'character',
          handler: async () => await this.talkToSelf()
        },
        {
          name: 'craftAxe',
          text: '制作石斧',
          icon: '🪓',
          duration: 1,
          energyCost: 5,
          actionGroup: 'character',
          // preExecute：先校验材料和体力，全部扣除后进度条才启动
          preExecute: () => {
            if (!inventory.hasEnough('branch', 3) || !inventory.hasEnough('ore', 2)) {
              toast({ message: '需要树枝 ×3 + 矿石 ×2 才能制作石斧', type: 'warning' });
              return false;
            }
            if (character.energy < 5) {
              toast({ message: '体力不足，无法制作石斧', type: 'warning' });
              return false;
            }
            inventory.removeItem('branch', 3);
            inventory.removeItem('ore', 2);
            character.energy = Math.max(0, character.energy - 5);
            return true;
          },
          handler: async () => {
            // 材料已在 preExecute 中消耗，直接创建石斧耐久
            if (!equipment.inventory.axe) {
              equipment.inventory.axe = { durability: 0, maxDurability: 100 };
            }
            equipment.inventory.axe.durability = Math.min(
              equipment.inventory.axe.maxDurability,
              equipment.inventory.axe.durability + 100
            );
            const message = '成功打造了一把石斧！';
            toast({ message, type: 'success' });
            useGameLogStore().addEntry({
              text: message,
              type: 'ITEM',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
            });
          },
          disabled: () => !inventory.hasEnough('branch', 3) || !inventory.hasEnough('ore', 2),
          tooltip: '需要树枝 ×3 + 矿石 ×2'
        },
        {
          name: 'craftPickaxe',
          text: '制作石镐',
          icon: '⛏️',
          duration: 1,
          energyCost: 5,
          actionGroup: 'character',
          preExecute: () => {
            if (!inventory.hasEnough('branch', 2) || !inventory.hasEnough('ore', 3)) {
              toast({ message: '需要树枝 ×2 + 矿石 ×3 才能制作石镐', type: 'warning' });
              return false;
            }
            if (character.energy < 5) {
              toast({ message: '体力不足，无法制作石镐', type: 'warning' });
              return false;
            }
            inventory.removeItem('branch', 2);
            inventory.removeItem('ore', 3);
            character.energy = Math.max(0, character.energy - 5);
            return true;
          },
          handler: async () => {
            // 材料已在 preExecute 中消耗，直接创建石镐耐久
            if (!equipment.inventory.pickaxe) {
              equipment.inventory.pickaxe = { durability: 0, maxDurability: 100 };
            }
            equipment.inventory.pickaxe.durability = Math.min(
              equipment.inventory.pickaxe.maxDurability,
              equipment.inventory.pickaxe.durability + 100
            );
            const message = '成功打造了一把石镐！';
            toast({ message, type: 'success' });
            useGameLogStore().addEntry({
              text: message,
              type: 'ITEM',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
            });
          },
          disabled: () => !inventory.hasEnough('branch', 2) || !inventory.hasEnough('ore', 3),
          tooltip: '需要树枝 ×2 + 矿石 ×3'
        },
        {
          name: 'craftTorch',
          text: '制作火把',
          icon: '🕯️',
          duration: 0.5,
          energyCost: 3,
          actionGroup: 'character',
          preExecute: () => {
            if (!inventory.hasEnough('branch', 1) || !inventory.hasEnough('grass', 2)) {
              toast({ message: '需要树枝 ×1 + 草 ×2 才能制作火把', type: 'warning' });
              return false;
            }
            if (character.energy < 3) {
              toast({ message: '体力不足，无法制作火把', type: 'warning' });
              return false;
            }
            inventory.removeItem('branch', 1);
            inventory.removeItem('grass', 2);
            character.energy = Math.max(0, character.energy - 3);
            return true;
          },
          handler: async () => {
            // 材料已在 preExecute 中消耗，火把加入装备库存
            this.addTorchDurability(equipment);
            const message = '用树枝和草制作了一个火把，可在装备页面装备到饰品槽';
            toast({ message, type: 'success' });
            useGameLogStore().addEntry({
              text: message,
              type: 'ITEM',
              gameTimestamp: useTimeStore().timestamp,
              timestamp: Date.now()
            });
          },
          disabled: () => !inventory.hasEnough('branch', 1) || !inventory.hasEnough('grass', 2),
          tooltip: '需要树枝 ×1 + 草 ×2，装备后可驱赶夜间野兽'
        }
      ];
    },

    // 获取建筑动作（根据建筑类型返回对应动作列表）
    getBuildingActions(buildingType: string): GameBuildingAction[] {
      const inventory = useInventoryStore();
      const character = useCharacterStore();
      switch (buildingType) {
        case 'campfire':
          return [
            {
              name: 'warmUp',
              text: '取暖',
              icon: '🌡️',
              duration: 1,
              energyCost: 0,
              handler: async () => await this.warmUp()
            }
          ];
        case 'woodenHut':
          return [
            {
              name: 'sleep',
              text: '睡觉',
              icon: '🛏️',
              duration: 1.5,
              energyCost: 0,
              preExecute: () => {
                const SATIETY_COST = 20;
                if (character.satiety <= SATIETY_COST) {
                  toast({ message: '太饿了，睡不着...', type: 'warning' });
                  return false;
                }
                // 立即消耗饱食度，进度条（睡觉动画）后产出体力
                character.satiety = Math.max(0, character.satiety - SATIETY_COST);
                return true;
              },
              handler: async () => {
                // 饱食度已在 preExecute 中消耗，直接产出体力
                const ENERGY_RESTORE = 30;
                character.energy = Math.min(100, character.energy + ENERGY_RESTORE);
                const message = `睡了一觉，体力恢复了 +${ENERGY_RESTORE}，饱食度 -20`;
                toast({ message, type: 'success' });
                useGameLogStore().addEntry({
                  text: message,
                  type: 'SYSTEM',
                  gameTimestamp: useTimeStore().timestamp,
                  timestamp: Date.now()
                });
              },
              tooltip: '消耗饱食度恢复体力'
            }
          ];
        case 'workbench':
        case 'cookingTable':
          return [
            {
              name: 'craftTool',
              text: '制作工具',
              icon: '🔧',
              duration: 2,
              energyCost: 10,
              preExecute: () => {
                if (!inventory.hasEnough('wood', 2) || !inventory.hasEnough('ore', 1)) {
                  toast({ message: '需要木材 ×2 + 矿石 ×1 才能制作工具', type: 'warning' });
                  return false;
                }
                if (character.energy < 10) {
                  toast({ message: '体力不足，无法制作工具', type: 'warning' });
                  return false;
                }
                inventory.removeItem('wood', 2);
                inventory.removeItem('ore', 1);
                character.energy = Math.max(0, character.energy - 10);
                return true;
              },
              handler: async () => {
                inventory.addItem({ id: 'tool', type: 'tool', name: '工具' }, 1);
                const message = '在工作台上制作了一件工具';
                toast({ message, type: 'success' });
                useGameLogStore().addEntry({
                  text: message,
                  type: 'ITEM',
                  gameTimestamp: useTimeStore().timestamp,
                  timestamp: Date.now()
                });
              },
              tooltip: '需要木材×2 + 矿石×1',
              disabled: () => !inventory.hasEnough('wood', 2) || !inventory.hasEnough('ore', 1)
            }
          ];
        case 'storageBox':
          // 储藏箱无动作，只显示库存
          return [];
        case 'farmPlot':
          return [
            {
              name: 'plantVegetable',
              text: '种植蔬菜',
              icon: '🥬',
              duration: 2,
              energyCost: 8,
              preExecute: () => {
                if (!inventory.hasEnough('branch', 1)) {
                  toast({ message: '需要树枝 ×1 才能种植蔬菜', type: 'warning' });
                  return false;
                }
                if (character.energy < 8) {
                  toast({ message: '体力不足，无法种植蔬菜', type: 'warning' });
                  return false;
                }
                inventory.removeItem('branch', 1);
                character.energy = Math.max(0, character.energy - 8);
                return true;
              },
              handler: async () => {
                const amount = Math.floor(Math.random() * 2) + 1; // 1-2
                inventory.addItem({ id: 'vegetable', type: 'vegetable', name: '蔬菜' }, amount);
                const message = `在农田里种出了 ${amount} 株蔬菜！`;
                toast({ message, type: 'success' });
                useGameLogStore().addEntry({
                  text: message,
                  type: 'ITEM',
                  gameTimestamp: useTimeStore().timestamp,
                  timestamp: Date.now()
                });
              },
              tooltip: '需要树枝 ×1',
              disabled: () => !inventory.hasEnough('branch', 1)
            }
          ];
        case 'herbShop':
          return [
            {
              name: 'makeFirstAid',
              text: '制作急救包',
              icon: '🩹',
              duration: 1.5,
              energyCost: 5,
              preExecute: () => {
                if (!inventory.hasEnough('herb', 2)) {
                  toast({ message: '需要草药 ×2 才能制作急救包', type: 'warning' });
                  return false;
                }
                if (character.energy < 5) {
                  toast({ message: '体力不足，无法制作急救包', type: 'warning' });
                  return false;
                }
                inventory.removeItem('herb', 2);
                character.energy = Math.max(0, character.energy - 5);
                return true;
              },
              handler: async () => {
                inventory.addItem({ id: 'first_aid', type: 'first_aid', name: '急救包' }, 1);
                const message = '用草药制作了 1 个急救包';
                toast({ message, type: 'success' });
                useGameLogStore().addEntry({
                  text: message,
                  type: 'ITEM',
                  gameTimestamp: useTimeStore().timestamp,
                  timestamp: Date.now()
                });
              },
              tooltip: '需要草药 ×2',
              disabled: () => !inventory.hasEnough('herb', 2)
            },
            {
              name: 'makeNourishingSoup',
              text: '制作滋补汤',
              icon: '🍲',
              duration: 1.5,
              energyCost: 5,
              preExecute: () => {
                if (!inventory.hasEnough('vegetable', 2) || !inventory.hasEnough('raw_meat', 1)) {
                  toast({ message: '需要蔬菜 ×2 + 生肉 ×1 才能制作滋补汤', type: 'warning' });
                  return false;
                }
                if (character.energy < 5) {
                  toast({ message: '体力不足，无法制作滋补汤', type: 'warning' });
                  return false;
                }
                inventory.removeItem('vegetable', 2);
                inventory.removeItem('raw_meat', 1);
                character.energy = Math.max(0, character.energy - 5);
                return true;
              },
              handler: async () => {
                inventory.addItem({ id: 'nourishing_soup', type: 'nourishing_soup', name: '滋补汤' }, 1);
                const message = '用蔬菜和生肉炖出了 1 碗滋补汤！';
                toast({ message, type: 'success' });
                useGameLogStore().addEntry({
                  text: message,
                  type: 'ITEM',
                  gameTimestamp: useTimeStore().timestamp,
                  timestamp: Date.now()
                });
              },
              tooltip: '需要蔬菜 ×2 + 生肉 ×1',
              disabled: () => !inventory.hasEnough('vegetable', 2) || !inventory.hasEnough('raw_meat', 1)
            }
          ];
        case 'trap':
          // 陷阱无普通建筑动作，通过专属弹窗 UI 交互
          return [];
        default:
          return [];
      }
    },

    // 获取场景基础动作（场景相关，与建筑无关）
    getActionConfig(): GameAction[] {
      const character = useCharacterStore();
      return [
        {
          name: 'explore',
          text: '探索',
          icon: '🔍',
          duration: 1.5,
          energyCost: 10,
          actionGroup: 'scene',
          preExecute: () => {
            if (character.energy < 10) {
              toast({ message: '体力不足，无法探索', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 10);
            return true;
          },
          handler: async () => await this.explore()
        },
        {
          name: 'meditate',
          text: '冥想',
          icon: '🧘',
          duration: 1,
          energyCost: 0,
          actionGroup: 'scene',
          handler: async () => await this.meditateCharacter()
        },
        {
          name: 'tidyCamp',
          text: '整理营地',
          icon: '🧹',
          duration: 1,
          energyCost: 5,
          actionGroup: 'scene',
          preExecute: () => {
            if (character.energy < 5) {
              toast({ message: '体力不足，无法整理营地', type: 'warning' });
              return false;
            }
            character.energy = Math.max(0, character.energy - 5);
            return true;
          },
          handler: async () => await this.tidyCamp()
        }
      ];
    },

    // 陷阱定时捕获动物
    checkTrap() {
      const traps = this.scene.buildings.filter(b => b.type === 'trap');
      if (traps.length === 0) return;

      const now = Date.now();

      // 各等级配置（intervalMs 单位：毫秒）
      const TRAP_CONFIG: Record<number, { intervalMs: number; chance: number; animals: TrapAnimal[] }> = {
        1: {
          intervalMs: 60000, // 60 秒
          chance: 0.6,
          animals: [
            { id: 'rabbit', name: '兔子', yields: [{ id: 'raw_meat', name: '生肉', count: 1 }, { id: 'fur', name: '皮毛', count: 1 }] }
          ]
        },
        2: {
          intervalMs: 50000, // 50 秒
          chance: 0.7,
          animals: [
            { id: 'rabbit', name: '兔子', yields: [{ id: 'raw_meat', name: '生肉', count: 1 }, { id: 'fur', name: '皮毛', count: 1 }] },
            { id: 'deer', name: '鹿', yields: [{ id: 'raw_meat', name: '生肉', count: 2 }, { id: 'fur', name: '皮毛', count: 2 }, { id: 'bone', name: '骨头', count: 1 }] }
          ]
        },
        3: {
          intervalMs: 45000, // 45 秒
          chance: 0.8,
          animals: [
            { id: 'rabbit', name: '兔子', yields: [{ id: 'raw_meat', name: '生肉', count: 1 }, { id: 'fur', name: '皮毛', count: 1 }] },
            { id: 'deer', name: '鹿', yields: [{ id: 'raw_meat', name: '生肉', count: 2 }, { id: 'fur', name: '皮毛', count: 2 }, { id: 'bone', name: '骨头', count: 1 }] },
            { id: 'boar', name: '野猪', yields: [{ id: 'raw_meat', name: '生肉', count: 3 }, { id: 'fur', name: '皮毛', count: 3 }, { id: 'bone', name: '骨头', count: 2 }] }
          ]
        }
      };

      const maxLevel = Math.max(...Object.keys(TRAP_CONFIG).map(Number));
      const minLevel = Math.min(...Object.keys(TRAP_CONFIG).map(Number));

      for (const trap of traps) {
        // 已有捕获，等玩家处理
        if (trap.trapAnimal) continue;

        // 已损坏，等待修复
        if (trap.trapDamaged) continue;

        const level = Math.max(minLevel, Math.min(maxLevel, trap.level));
        const config = TRAP_CONFIG[level];
        const lastCheck = trap.trapCapturedAt ?? 0;

        if (now - lastCheck < config.intervalMs) continue;

        // 重置检查时间（无论是否捕获，都更新计时），并标记为损坏
        trap.trapCapturedAt = now;
        trap.trapDamaged = true;

        if (Math.random() < config.chance) {
          const animal = config.animals[Math.floor(Math.random() * config.animals.length)];
          trap.trapAnimal = animal;
          toast({ message: `陷阱捕获了一只${animal.name}！陷阱已损坏，需要修复才能继续使用`, type: 'success' });
          useGameLogStore().addEntry({
            text: `陷阱捕获了一只${animal.name}！`,
            type: 'ITEM',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
          });
        } else {
          toast({ message: '陷阱被触发了，但什么都没抓到，陷阱已损坏', type: 'info' });
          useGameLogStore().addEntry({
            text: '陷阱被触发了，但什么都没抓到，陷阱已损坏',
            type: 'ACTION',
            gameTimestamp: useTimeStore().timestamp,
            timestamp: Date.now()
          });
        }
      }
    },

    // 修复陷阱：消耗资源清除损坏状态
    repairTrap(building: import('./types').GameBuilding) {
      const inventory = useInventoryStore();
      const missing: string[] = [];
      for (const [res, amount] of Object.entries(TRAP_REPAIR_COST)) {
        if (!inventory.hasEnough(res, amount)) {
          missing.push(`${RESOURCE_NAMES[res] ?? res}×${amount}`);
        }
      }
      if (missing.length > 0) {
        toast({ message: `修复需要：${missing.join('、')}`, type: 'warning' });
        return;
      }
      for (const [res, amount] of Object.entries(TRAP_REPAIR_COST)) {
        inventory.removeItem(res, amount);
      }
      building.trapDamaged = false;
      building.trapCapturedAt = Date.now();
      toast({ message: '陷阱已修复，重新开始等待猎物', type: 'success' });
      useGameLogStore().addEntry({
        text: '修复了陷阱，重新开始等待猎物',
        type: 'ACTION',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    // 摧毁陷阱：删除建筑，回收部分材料
    destroyTrap(building: import('./types').GameBuilding) {
      const inventory = useInventoryStore();
      for (const [res, amount] of Object.entries(TRAP_DESTROY_RETURN)) {
        inventory.addItem({ id: res, type: res, name: RESOURCE_NAMES[res] ?? res }, amount);
      }
      const idx = this.scene.buildings.indexOf(building);
      if (idx !== -1) this.scene.buildings.splice(idx, 1);
      const returnText = Object.entries(TRAP_DESTROY_RETURN)
        .map(([res, amt]) => `${RESOURCE_NAMES[res] ?? res}×${amt}`)
        .join('、');
      toast({ message: `陷阱已摧毁，回收了 ${returnText}`, type: 'info' });
      useGameLogStore().addEntry({
        text: `摧毁了陷阱，回收了 ${returnText}`,
        type: 'ACTION',
        gameTimestamp: useTimeStore().timestamp,
        timestamp: Date.now()
      });
    },

    initializeScene() {
      this.scene.actions = this.getActionConfig();

      // 注册夜晚野兽袭击监听（防止重复注册）
      if (!this._nightAttackListenerRegistered) {
        this._nightAttackListenerRegistered = true;
        emitter.on('hour-passed', () => {
          const timeStore = useTimeStore();
          if (timeStore.currentPeriod !== 'NIGHT') return;

          const currentDay = timeStore.day;
          if (this.lastNightAttackDay === currentDay) return;

          // 检查保护：基地有篝火，或装备了火把
          const hasCampfire = this.scene.buildings.some(b => b.type === 'campfire');
          const equipment = useEquipmentStore();
          const hasTorch = equipment.slots.accessory === 'torch';
          if (hasCampfire || hasTorch) return;

          // 30% 概率触发野兽袭击
          if (Math.random() > NIGHT_ATTACK_CHANCE) return;

          this.lastNightAttackDay = currentDay;

          const character = useCharacterStore();
          const damage = Math.floor(Math.random() * 11) + 10; // 10-20 伤害
          character.health = Math.max(0, character.health - damage);

          const message = `夜晚，一只野兽突然袭击了你！失去了 ${damage} 点血量。（提示：建造篝火或装备火把可以驱赶野兽）`;
          toast({ message, type: 'error' });
          useGameLogStore().addEntry({
            text: message,
            type: 'SYSTEM',
            gameTimestamp: timeStore.timestamp,
            timestamp: Date.now()
          });
        });
      }
    }
  },

  persist: {
    omit: ['_nightAttackListenerRegistered']
  }
});
