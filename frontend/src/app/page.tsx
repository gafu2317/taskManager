'use client';

import { useState, useEffect, useRef} from "react";
import { Task } from "../types/task";
import { getTasks } from "../lib/api";
import TaskForm from "@/components/features/tasks/TaskForm";
import TaskBubbleView from "@/components/features/tasks/TaskBubbleView";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 350 });
  const bubbleAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTasks();
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
          height: Math.floor(rect.height * 0.9) 
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
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
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
          className="w-full h-full flex justify-center items-center"
        >
          <TaskBubbleView 
            tasks={tasks} 
            loading={loading}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
        </div>
      </div>

      {/* 右列 - ポモドーロタイマーなど (20%) */}
      <div className="w-1/5 bg-white border-l border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-6 text-gray-800">Tools</h2>
        <div className="space-y-4">
          {/* ポモドーロタイマー */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-800 mb-2">🍅 Pomodoro Timer</h3>
            <p className="text-sm text-red-600 mb-2">25:00</p>
            <button className="w-full bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600">
              Start
            </button>
          </div>

          {/* 統計情報 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">📊 Statistics</h3>
            <div className="text-sm text-blue-600 space-y-1">
              <p>Total tasks: {tasks.length}</p>
              <p>Completed: {tasks.filter(task => task.completed).length}</p>
              <p>Pending: {tasks.filter(task => !task.completed).length}</p>
            </div>
          </div>

          {/* 設定 */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">⚙️ Settings</h3>
            <button className="w-full bg-gray-500 text-white py-2 px-3 rounded text-sm hover:bg-gray-600">
              Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
