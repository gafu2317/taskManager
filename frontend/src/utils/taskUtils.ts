export const getTaskBubbleSize = (importance: number): number => {
  return importance * importance * 8 + 20;
};

export const getTaskBubbleRadius = (importance: number): number => {
  return getTaskBubbleSize(importance) / 2;
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

export const getImportanceButtonSize = (importance: number): string => {
  const baseSize = 8; // 基本8 (32px)
  const size = baseSize + importance * 2; // 10, 12, 14, 16, 18
  return `w-${size} h-${size}`;
};