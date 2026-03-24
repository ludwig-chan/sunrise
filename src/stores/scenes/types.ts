export interface GameAction {
  name: string;
  text: string;
  duration: number;
  energyCost: number; // 新增: 该动作需要消耗的体力值
  handler: () => Promise<void>;
  disabled?: boolean | (() => boolean);
  tooltip?: string;
  group?: string; // 用于 UI 分组，同组按钮横排显示
}

export interface GameBuildingRecipe {
  type: string;
  name: string;
  description: string;
  cost: { [resourceType: string]: number };
  duration: number; // 建造耗时（游戏天数）
  energyCost: number;
}

export interface GameResource {
  id: string;
  type: string;
  name: string;
  count: number;
  maxCount?: number;
  description?: string;
}

export interface GameBuilding {
  name: string;
  type: string;
  level: number;
}

export interface GameScene {
  id: string;
  name: string;
  actions: GameAction[];
  resources: GameResource[];
  buildings: GameBuilding[];
  // 场景库存,记录场景中资源的当前数量和最大数量
  stock: {
    [key: string]: {
      current: number;  // 当前数量
      max: number;      // 最大数量
    }
  };
}
