export const getTaskBubbleSize = (cost: number): number => {
  return cost * cost * 4 + 80;
};

export const getTaskBubbleRadius = (cost: number): number => {
  return getTaskBubbleSize(cost) / 2;
};

export const getCostColor = (cost: number): string => {
  const colors = {
    1: '#3B82F6', // 青（Blue-500）
    2: '#10B981', // 緑（Green-500） 
    3: '#FDE047', // 明るい黄色（Yellow-300）
    4: '#F97316', // オレンジ（Orange-500）
    5: '#EF4444'  // 赤（Red-500）
  };
  return colors[cost as keyof typeof colors] || colors[1];
};

export const getCostButtonSize = (cost: number): string => {
  const sizeMap = {
    1: 'w-8 h-8',   // 32px
    2: 'w-9 h-9',   // 36px 
    3: 'w-10 h-10', // 40px
    4: 'w-11 h-11', // 44px
    5: 'w-12 h-12'  // 48px
  };
  return sizeMap[cost as keyof typeof sizeMap] || sizeMap[1];
};