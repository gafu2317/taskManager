const REFERENCE_WIDTH = 600;

export const getTaskBubbleSize = (cost: number, containerWidth: number = REFERENCE_WIDTH): number => {
  const scale = Math.min(Math.max(containerWidth / REFERENCE_WIDTH, 0.5), 2.0);
  return (cost * 7 + 43) * scale;
};

export const getTaskBubbleRadius = (cost: number, containerWidth: number = REFERENCE_WIDTH): number => {
  return getTaskBubbleSize(cost, containerWidth) / 2;
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