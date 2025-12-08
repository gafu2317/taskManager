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
}

const TaskBubbleView = ({tasks, loading, containerWidth, containerHeight, onTaskSelect}: TaskBubbleViewProps) => {
  const [bubblePositions, setBubblePositions] = useState<Record<string, {x: number, y: number, radius: number}>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const handleBubbleClick = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
    setIsPaused(!isPaused); // 全バブル一括で停止/再開
    onTaskSelect(taskId); // 上位コンポーネントに伝える
  };
  

  const handlePositionUpdate = (id: string, position: {x: number, y: number}) => {
    const task = tasks.find(task => task.id === id);
    const radius = task ? getTaskBubbleRadius(task.importance) : 21;
    setBubblePositions((prev) => ({
      ...prev,
      [id]: { x: position.x, y: position.y, radius }
    }));
  };
  const getOtherBubbles = (currentId: string) => {
    const others = Object.entries(bubblePositions)
      .filter(([id]) => id !== currentId)
      .map(([_, pos]) => pos);
    return others;
  };
  // containerWidth と containerHeight は props から受け取る
  return (
    <>
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100"
        style={{ width: containerWidth, height: containerHeight }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-600">Loading bubbles...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">No tasks to display</p>
          </div>
        ) : (
          // 風船表示
          tasks.map((task) => (
            <PhysicsBubble
              key={task.id}
              task={task} 
              isPaused={isPaused}
              onBubbleClick={() => handleBubbleClick(task.id)}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
              otherBubbles={getOtherBubbles(task.id)}
              onPositionUpdate={handlePositionUpdate}
            />
          ))
        )}
      </div>
    </>
  )
}

export default TaskBubbleView
