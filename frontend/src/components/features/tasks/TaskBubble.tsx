import React from 'react'
import { Task } from '../../../types/task'


interface TaskBubbleProps {
  task: Task;
  x: number;
  y: number;

}

const TaskBubble = ({ task, x, y  }: TaskBubbleProps) => {
  const size = task.importance * 12 + 30; // 重要度に基づくサイズ調整（42-90px）
  // コスト別色設定
  const getCostColor = (cost: number): string => {
    const colors = {
      1: '#3B82F6', // 青（Blue-500）
      2: '#10B981', // 緑（Green-500） 
      3: '#F59E0B', // 黄色（Yellow-500）
      4: '#F97316', // オレンジ（Orange-500）
      5: '#EF4444'  // 赤（Red-500）
    };
    return colors[cost as keyof typeof colors] || colors[1];
  };
  const costColor = getCostColor(task.cost);


  return (
    <>
      <div style={{
        position: 'absolute',
        transform: `translate(${x - size/2}px, ${y - size/2}px)`,
        width: size,
        height: size,
        backgroundColor: costColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.min(size / 8, 12),
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        overflow: 'hidden',
        padding: '2px'
      }}>
        {task.title}
      </div>
    </>
  );
};
export default TaskBubble;