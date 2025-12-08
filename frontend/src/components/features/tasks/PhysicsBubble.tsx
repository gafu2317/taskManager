import React, {useEffect, useState, useRef} from 'react'
import { Task } from '../../../types/task'
import TaskBubble from './TaskBubble';

interface PhysicsBubbleProps {
  task: Task; 
  containerWidth: number;
  containerHeight: number;
  otherBubbles?: {x: number, y: number, radius: number}[];
  onPositionUpdate?: (id: string, position:{x: number, y: number}) => void;
  isPaused: boolean;
  onBubbleClick: (taskId: string) => void;
}

const PhysicsBubble = ({task, containerHeight, containerWidth, onPositionUpdate, otherBubbles, isPaused, onBubbleClick}:PhysicsBubbleProps) => {
  const [position, setPosition] = React.useState<{x: number, y: number}>({x: Math.random() * (containerWidth-90), y: Math.random() * (containerHeight-90)}); 
  
  const velocityRef = useRef((() => {
    const vx = (Math.random() - 0.5) * 3;
    const vy = (Math.random() - 0.5) * 3;

    // 最低速度2を保証
    return {
      x: Math.abs(vx) < 2 ? (vx >= 0 ? 1 : -1) : vx,
      y: Math.abs(vy) < 2 ? (vy >= 0 ? 1 : -1) : vy
    };
  })());

  
  const otherBubblesRef = useRef(otherBubbles);
  otherBubblesRef.current = otherBubbles;
  
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  
  const onPositionUpdateRef = useRef(onPositionUpdate);
  onPositionUpdateRef.current = onPositionUpdate;
  useEffect(() => {
    let animattionId: number;

    const animate = () => {
      // 停止中は位置更新をスキップ、ただし位置報告は継続
      if (isPausedRef.current) {
        animattionId = requestAnimationFrame(animate);
        return;
      }

      setPosition((prev) => {
        let radius = task.importance * 6 + 15; // 半径
        let newX = prev.x + velocityRef.current.x;
        let newY = prev.y + velocityRef.current.y;
        let collisionDetected = false;
        
        // 他の風船との衝突判定（壁より先に処理）
        const currentOtherBubbles = otherBubblesRef.current;
        
        if(currentOtherBubbles && currentOtherBubbles.length > 0) {
          for(const bubble of currentOtherBubbles) {
            const dx = newX - bubble.x;
            const dy = newY - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = radius + bubble.radius;
            
            if(distance < minDistance && distance > 0) {
              
              // 衝突を避けるために位置を調整
              const overlap = minDistance - distance;
              const normalX = dx / distance;
              const normalY = dy / distance;
              
              // 位置を少し離す
              newX = bubble.x + normalX * minDistance;
              newY = bubble.y + normalY * minDistance;
              
              // 速度を反転
              velocityRef.current.x = -velocityRef.current.x;
              velocityRef.current.y = -velocityRef.current.y;
              
              collisionDetected = true;
              break; // 一つの衝突だけ処理
            }
          }
        }

        // 壁衝突判定（バルーン衝突後に処理）
        if(newX <= radius || newX >= containerWidth - radius) {
          velocityRef.current.x = -velocityRef.current.x;
          newX = Math.max(radius, Math.min(newX, containerWidth - radius));
        }
        if(newY <= radius || newY >= containerHeight - radius) {
          velocityRef.current.y = -velocityRef.current.y;
          newY = Math.max(radius, Math.min(newY, containerHeight - radius));
        }

        const newPosition = { x: newX, y: newY };
        
        // 位置更新を非同期で報告
        if(onPositionUpdateRef.current) {
          queueMicrotask(() => {
            onPositionUpdateRef.current?.(task.id, newPosition);
          });
        }

        return newPosition;
      });

      animattionId = requestAnimationFrame(animate);
    };
    
    animate(); // 常にアニメーションループを開始
    return () => cancelAnimationFrame(animattionId);
  }, []);

  return (
  <>
    <TaskBubble task={task} x={position.x} y={position.y} onBubbleClick={onBubbleClick}></TaskBubble>
  </>
  )
}

export default PhysicsBubble
