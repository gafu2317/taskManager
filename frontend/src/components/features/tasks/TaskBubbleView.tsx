import React, {useState} from 'react'
import { Task } from '../../../types/task'
import PhysicsBubble from './PhysicsBubble'
import { getTaskBubbleRadius } from '../../../utils/taskUtils'

interface TaskBubbleViewProps {
  tasks: Task[];
  loading: boolean;
  containerWidth: number;
  containerHeight: number;
  onTaskSelect: (taskId: string) => void;
  onTaskComplete: (taskId: string) => void;
  selectedTaskId: string | null;
}

const TaskBubbleView = ({tasks, loading, containerWidth, containerHeight, onTaskSelect, onTaskComplete, selectedTaskId}: TaskBubbleViewProps) => {
  const [bubblePositions, setBubblePositions] = useState<Record<string, {x: number, y: number, radius: number}>>({});

  const handleBubbleClick = (taskId: string) => {
    // 上位コンポーネント（page.tsx）の状態管理に委ねる
    onTaskSelect(taskId);
  };
  

  const handlePositionUpdate = (id: string, position: {x: number, y: number}) => {
    const task = tasks.find(task => task.id === id);
    const radius = task ? getTaskBubbleRadius(task.cost) : 21;
    setBubblePositions((prev) => ({
      ...prev,
      [id]: { x: position.x, y: position.y, radius }
    }));
  };
  const getOtherBubbles = (currentId: string) => {
    const others = Object.entries(bubblePositions)
      .filter(([id]) => id !== currentId)
      .map(([, pos]) => pos);
    return others;
  };
  // containerWidth と containerHeight は props から受け取る
  return (
    <>
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100"
        style={{ width: containerWidth, height: containerHeight }}
        onClick={(e) => {
          e.stopPropagation();
          // バブルエリア内の空白をクリック → 選択解除
          onTaskSelect(''); // 空文字で選択解除を通知
        }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-600">バブルを読み込み中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">表示するタスクがありません</p>
          </div>
        ) : (
          // 風船表示
          tasks.map((task) => (
            <PhysicsBubble
              key={task.id}
              task={task} 
              selectedTaskId={selectedTaskId}
              onBubbleClick={() => handleBubbleClick(task.id)}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              otherBubbles={getOtherBubbles(task.id)}
              onPositionUpdate={handlePositionUpdate}
              onTaskComplete={() => onTaskComplete(task.id)}
            />
          ))
        )}
      </div>
    </>
  )
}

export default TaskBubbleView
