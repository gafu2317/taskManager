export const getTaskBubbleSize = (importance: number): number => {
  return importance * importance * 8 + 20;
};

export const getTaskBubbleRadius = (importance: number): number => {
  return getTaskBubbleSize(importance) / 2;
};