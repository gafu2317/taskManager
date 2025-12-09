import React, { useRef, useState } from 'react'
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
  
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasLongPressRef = useRef(false);
  const pressStartTimeRef = useRef<number>(0);
  const LONG_PRESS_DURATION = 1500; // 1.5秒
  const LONG_PRESS_START_THRESHOLD = 200; // 200ms後に長押し開始

  const startLongPress = () => {
    pressStartTimeRef.current = Date.now();
    setIsLongPressing(true);
    wasLongPressRef.current = false;
    
    // 200ms後に長押し状態にする
    longPressStartTimerRef.current = setTimeout(() => {
      onBubbleClick(task.id); // 長押し開始時にバブルを停止
      
      longPressTimerRef.current = setTimeout(() => {
        wasLongPressRef.current = true;
        onTaskComplete(task.id);
        setIsLongPressing(false);
      }, LONG_PRESS_DURATION - LONG_PRESS_START_THRESHOLD);
    }, LONG_PRESS_START_THRESHOLD);
  };

  const stopLongPress = () => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    
    if (longPressStartTimerRef.current) {
      clearTimeout(longPressStartTimerRef.current);
      longPressStartTimerRef.current = null;
    }
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // 200ms以内の場合は通常クリック扱い
    if (pressDuration < LONG_PRESS_START_THRESHOLD) {
      wasLongPressRef.current = false;
    }
    
    setIsLongPressing(false);
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
        // 長押しでタスクが完了した場合はクリック処理をスキップ
        if (!wasLongPressRef.current) {
          setTimeout(() => onBubbleClick(task.id), 0);
        }
        wasLongPressRef.current = false; // フラグをリセット
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