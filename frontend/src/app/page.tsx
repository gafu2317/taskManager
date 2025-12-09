'use client';

import { useState, useEffect, useRef} from "react";
import { Task } from "../types/task";
import { getTasks, deleteTask, updateTask } from "../lib/api";
import TaskForm from "@/components/features/tasks/TaskForm";
import TaskBubbleView from "@/components/features/tasks/TaskBubbleView";
import TaskDetail from "@/components/features/tasks/TaskDetail";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 350 });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const bubbleAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTasks({completed: false});
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // バブルエリアのサイズを親要素に合わせて動的に取得
  useEffect(() => {
    const updateSize = () => {
      if (bubbleAreaRef.current) {
        const rect = bubbleAreaRef.current.getBoundingClientRect();
        setContainerSize({ 
          width: Math.floor(rect.width * 0.9), // 90%を使用（余白確保）
          height: Math.floor(rect.height * 0.7) 
        });
      }
    };

    // 初回実行
    updateSize();
    
    // リサイズ対応
    window.addEventListener('resize', updateSize);
    
    // クリーンアップ
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleTaskCreated = async () => {
    setLoading(true);
    try {
      const fetchedTasks = await getTasks({completed: false});
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await updateTask(taskId, { completed: true });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    if (taskId === '') {
      // 空文字は選択解除
      setSelectedTaskId(null);
    } else {
      setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
    }
  };

  const handleContainerClick = () => {
    // バブルエリア外をクリック → 選択解除
    setSelectedTaskId(null);
  };

  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  return (
    <div className="flex h-screen bg-gray-50" onClick={handleContainerClick}>
      {/* 左列 - タスク作成 (20%) */}
      <div className="w-1/5 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Create Task</h2>
        <TaskForm onTaskCreated={handleTaskCreated} />
      </div>

      {/* 中央列 - タスクバブル表示 (60%) */}
      <div className="w-3/5 bg-white p-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Task Bubbles</h2>
        <div 
          ref={bubbleAreaRef}
          className="w-full h-full flex justify-center items-start"
        >
          <TaskBubbleView 
            tasks={tasks} 
            loading={loading}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onTaskSelect={handleTaskSelect}
            onTaskComplete={handleTaskComplete}
          />
        </div>
      </div>

      {/* 右列 - タスク詳細 (20%) */}
      <div className="w-1/5 bg-white border-l border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Task Detail</h2>
        {selectedTask ? (
          <TaskDetail selectedTask={selectedTask} />
        ) : (
          <p className="text-gray-500">Click a task bubble to view details</p>
        )}
      </div>
    </div>
  );
}
