import React, { useRef, useState, useEffect } from 'react'
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
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      setLongPressProgress(0);
      
      // 進行状況を更新
      progressIntervalRef.current = setInterval(() => {
        setLongPressProgress(prev => {
          const newProgress = prev + (100 / ((LONG_PRESS_DURATION - LONG_PRESS_START_THRESHOLD) / 50)); // 50msごと更新
          if (newProgress >= 100) {
            clearInterval(progressIntervalRef.current!);
            return 100;
          }
          return newProgress;
        });
      }, 50);
      
      longPressTimerRef.current = setTimeout(() => {
        wasLongPressRef.current = true;
        onTaskComplete(task.id);
        setIsLongPressing(false);
        setLongPressProgress(0);
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
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // 200ms以内の場合は通常クリック扱い
    if (pressDuration < LONG_PRESS_START_THRESHOLD) {
      wasLongPressRef.current = false;
    }
    
    setIsLongPressing(false);
    setLongPressProgress(0);
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
        fontSize: Math.min(size / 4, 16),
        color: textColor,
        fontWeight: 'bold',
        textAlign: 'center',
        overflow: 'hidden',
        padding: '2px',
        cursor: 'pointer',
        userSelect: 'none'
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
        
        {/* 長押し進行リング */}
        {isLongPressing && longPressProgress > 0 && (
          <svg 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
              pointerEvents: 'none'
            }}
          >
            <circle
              cx="50%"
              cy="50%"
              r={size / 2 - 4}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${(longPressProgress / 100) * (2 * Math.PI * (size / 2 - 4))} ${2 * Math.PI * (size / 2 - 4)}`}
              style={{
                transition: 'stroke-dasharray 0.05s linear'
              }}
            />
          </svg>
        )}
      </div>
    </>
  );
};
export default TaskBubble;