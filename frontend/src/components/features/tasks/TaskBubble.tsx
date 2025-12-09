import React, { useRef } from 'react'
import { Task } from '../../../types/task'
import { getTaskBubbleSize, getCostColor } from '../../../utils/taskUtils'


interface TaskBubbleProps {
  task: Task;
  x: number;
  y: number;
  onBubbleClick: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
}

const TaskBubble = ({ task, x, y, onBubbleClick, onTaskComplete }: TaskBubbleProps) => {
  const size = getTaskBubbleSize(task.importance);
  const costColor = getCostColor(task.cost);
  const textColor = 'black'; // 全て黒文字
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const LONG_PRESS_DURATION = 1500; // 1.5秒

  const startLongPress = () => {
    longPressTimerRef.current = setTimeout(() => {
      onTaskComplete(task.id);
    }, LONG_PRESS_DURATION);
  };

  const stopLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };


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
      onMouseDown={startLongPress}
      onMouseUp={stopLongPress}
      onMouseLeave={stopLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={stopLongPress}
      >
        {task.title}
      </div>
    </>
  );
};
export default TaskBubble;