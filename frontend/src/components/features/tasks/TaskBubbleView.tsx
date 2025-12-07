import React, {useState} from 'react'
import { Task } from '../../../types/task'
import PhysicsBubble from './PhysicsBubble';

interface TaskBubbleViewProps {
  tasks: Task[];
  loading: boolean;
}

const TaskBubbleView = ({tasks, loading}: TaskBubbleViewProps) => {
  const [bubblePositions, setBubblePositions] = useState<Record<string, {x: number, y: number, radius: number}>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const handleBubbleClick = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
    setIsPaused(taskId !== selectedTaskId ? true : false);
  };
  

  const handlePositionUpdate = (id: string, position: {x: number, y: number}) => {
    const task = tasks.find(task => task.id === id);
    const radius = task ? task.importance * 6 + 15 : 21;
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
  const containerWidth:number = 600;
  const containerHeight:number = 400;
  return (
    <>
      <div className="relative w-full h-64 border-3 border-brack rounded-lgoverflow-hidden bg-gradient-to-b from-blue-50 to-blue-100"
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
              isPaused={isPaused && selectedTaskId === task.id}
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
