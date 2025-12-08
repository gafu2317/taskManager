import React from 'react'
import { Task } from '../../../types/task'
import { getTaskBubbleSize, getCostColor } from '../../../utils/taskUtils'


interface TaskBubbleProps {
  task: Task;
  x: number;
  y: number;
  onBubbleClick: (taskId: string) => void;
}

const TaskBubble = ({ task, x, y, onBubbleClick  }: TaskBubbleProps) => {
  const size = getTaskBubbleSize(task.importance);
  const costColor = getCostColor(task.cost);
  const textColor = 'black'; // 全て黒文字


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
        color: textColor,
        fontWeight: 'bold',
        textAlign: 'center',
        overflow: 'hidden',
        padding: '2px'
      }}
      onClick={(e) => {
        e.preventDefault();
        setTimeout(() => onBubbleClick(task.id), 0);
      }}
      >
        {task.title}
      </div>
    </>
  );
};
export default TaskBubble;