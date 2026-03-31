export type ResourceInfo = {
  readonly id: string;
  readonly type: string;
  readonly name: string;
}

export type Stock = {
  [key: string]: {
    current: number;
    max: number;
  };
}

export async function getStockAmount(stock: Stock, type: string, amount: number = 1): Promise<number> {
  return new Promise((resolve, reject) => {
    const stockItem = stock[type];
    if (!stockItem || stockItem.current <= 0) {
      reject('库存不足');
      return;
    }

    const actualAmount = Math.min(stockItem.current, amount);
    // 自动扣减库存
    stock[type].current -= actualAmount;
    resolve(actualAmount);
  });
}

export function hasStock(stock: Stock, type: string): boolean {
  const stockItem = stock[type];
  return stockItem && stockItem.current > 0;
}

export function calculateExploreResources(stock: Stock, possibleResources: readonly ResourceInfo[]) {
  // 只选择还有库存的资源
  const availableResources = possibleResources.filter(resource =>
    hasStock(stock, resource.type)
  );

  if (availableResources.length === 0) {
    return [];
  }

  // 根据剩余比例计算每种资源的权重
  const resourcesWithWeight = availableResources.map(resource => {
    const stockItem = stock[resource.type];
    const ratio = stockItem.current / stockItem.max;
    const weight = Math.pow(ratio, 0.7) * (0.7 + Math.random() * 0.3);

    // 计算预期获取数量
    const baseAmount = Math.ceil(3 * ratio);
    const bonus = ratio > 0.8 && Math.random() < 0.3 ? 1 : 0;
    const expectedAmount = baseAmount + Math.floor(Math.random() * 2) + bonus;

    return {
      ...resource,
      weight,
      expectedAmount
    };
  });

  // 按权重排序并选择前1-3种资源
  resourcesWithWeight.sort((a, b) => b.weight - a.weight);
  const maxTypes = Math.min(3, resourcesWithWeight.length);
  const resourceTypesToGet = Math.floor(Math.random() * maxTypes) + 1;

  return resourcesWithWeight.slice(0, resourceTypesToGet);
}
