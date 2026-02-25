'use client';

import { useState, useEffect, useRef} from "react";
import { signIn, useSession } from "next-auth/react";
import { migrateGuestDataToCloud } from "../lib/authUtils";
import { Task } from "../types/task";
import { getTasks, deleteTask, updateTask, postMascotAction } from "../lib/api";
import TaskForm from "@/components/features/tasks/TaskForm";
import TaskBubbleView from "@/components/features/tasks/TaskBubbleView";
import TaskDetail from "@/components/features/tasks/TaskDetail";
import TaskEditModal from "@/components/features/tasks/TaskEditModal";
import TaskFilterPanel from "@/components/features/tasks/TaskFilterPanel";
import RegisterPrompt from "@/components/features/auth/RegisterPrompt";
import WorkTimeView from "@/components/features/worktime/WorkTimeView";
import Mascot from "@/components/features/mascot/Mascot";
import MascotView from "@/components/features/mascot/MascotView";
import { useTaskFilter } from "../hooks/useTaskFilter";
import { useMascot } from "../hooks/useMascot";
import { getMood } from "../lib/mascotDialogue";

export default function Home() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 350 });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRegisterPromptDismissed, setIsRegisterPromptDismissed] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'worktime' | 'mascot'>('tasks');
  const bubbleAreaRef = useRef<HTMLDivElement>(null);
  const {taskFilter, filteredTasks, handleFilterChange, availableTags} = useTaskFilter(tasks);
  const mood = getMood(tasks.length);
  const { dialogue, visible } = useMascot(mood);
  // ログイン状態変化時の処理
  useEffect(() => {
    const handleLogin = async () => {
      if (session?.user && (session.user as { id?: string }).id) {
        const userId = (session.user as { id: string }).id;
        console.log('ユーザーログイン検出:', userId);
        
        try {
          // LocalStorageのゲストデータをDynamoDBに移行
          await migrateGuestDataToCloud(userId);
          
          // タスクを再読み込み（DynamoDBから）
          const fetchedTasks = await getTasks({completed: false});
          setTasks(fetchedTasks);
        } catch (error) {
          console.error("Failed to migrate or fetch tasks:", error);
        }
      }
    };

    handleLogin();
  }, [session]);

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

    // 初回読み込み（ログイン状態に関係なく）
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
      
      // ログインしていない場合のみ登録促進ポップアップ表示判定
      console.log('Task created. Total tasks:', fetchedTasks.length, 'Dismissed:', isRegisterPromptDismissed, 'Session:', !!session);
      if (!session && !isRegisterPromptDismissed && fetchedTasks.length >= 5) {
        console.log('Showing register popup');
        setShowRegisterPopup(true);
      }
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
      // まず選択状態を解除して他のバブルを動かす
      setSelectedTaskId(null);
      
      await updateTask(taskId, { completed: true });
      postMascotAction('task_complete').then(res => {
        if (res) window.dispatchEvent(new CustomEvent('mascot-points-updated', { detail: { points: res.current_points } }));
      }).catch(() => {});
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskUpdated = async () => {
    const fetchedTasks = await getTasks({completed: false});
    setTasks(fetchedTasks);
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

  const handleRegisterClick = () => {
    // Googleアカウント作成に遷移
    signIn('google');
    setShowRegisterPopup(false);
  };

  const handleDismissRegisterPrompt = () => {
    setIsRegisterPromptDismissed(true);
    setShowRegisterPopup(false);
  };

  const selectedTask = tasks?.find(task => task.id === selectedTaskId);

  return (
    <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
      {/* タブバー */}
      <div className="flex items-center gap-1 px-4 pt-2 bg-white border-b border-gray-200 shrink-0">
        {([
          { key: 'tasks',    label: 'タスク管理',     icon: '📋' },
          { key: 'worktime', label: '作業時間記録',   icon: '⏱' },
          { key: 'mascot',   label: 'キャラクター',   icon: '🐱' },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors ${
              activeTab === key
                ? 'bg-blue-100 border-blue-300 text-blue-800'
                : 'bg-white border-transparent text-gray-400 hover:text-gray-600 hover:bg-blue-50 hover:border-blue-200'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* タスク管理タブ */}
      {activeTab === 'tasks' && (
        <div className="flex flex-1 overflow-hidden" onClick={handleContainerClick}>
          {/* 左列 - タスク作成 (20%) */}
          <div className="w-1/5 bg-white border-r border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-6 text-gray-800 flex flex-col items-center">タスク作成</h2>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>

          {/* 中央列 - タスクバブル表示 (60%) */}
          <div className="w-3/5 bg-white p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-6 text-gray-800">タスク一覧</h2>
            <TaskFilterPanel
              taskFilter={taskFilter}
              availableTags={availableTags}
              onFilterChange={handleFilterChange}
            />
            <div
              ref={bubbleAreaRef}
              className="w-full h-full flex justify-center items-start"
            >
              <TaskBubbleView
                tasks={filteredTasks}
                loading={loading}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                onTaskSelect={handleTaskSelect}
                onTaskComplete={handleTaskComplete}
                selectedTaskId={selectedTaskId}
              />
            </div>
          </div>

          {/* 右列 - タスク詳細 (20%) */}
          <div className="w-1/5 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
            {/* スクロール可能なコンテンツ領域 */}
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold mb-6 text-gray-800 flex flex-col items-center">タスク詳細</h2>
              {selectedTask ? (
                <TaskDetail selectedTask={selectedTask} onTaskDelete={handleTaskDelete} onTaskEdit={handleTaskEdit} onTaskComplete={handleTaskComplete} />
              ) : (
                <p className="text-gray-500">タスクバブルをクリックして詳細を表示</p>
              )}
            </div>
            {/* マスコット（常に下端に固定） */}
            <div className="shrink-0 px-6 pb-6">
              <Mascot mood={mood} dialogue={dialogue} visible={visible} />
            </div>
          </div>
        </div>
      )}

      {/* 作業時間タブ */}
      {activeTab === 'worktime' && (
        <WorkTimeView tasks={tasks} onTaskUpdated={handleTaskUpdated} />
      )}

      {/* キャラクタータブ */}
      {activeTab === 'mascot' && (
        <MascotView />
      )}

      {/* タスク編集モーダル */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* 登録促進ポップアップ */}
      {showRegisterPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleDismissRegisterPrompt}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <RegisterPrompt
              taskCount={tasks.length}
              onRegisterClick={handleRegisterClick}
              onDismiss={handleDismissRegisterPrompt}
              isDismissed={isRegisterPromptDismissed}
            />
          </div>
        </div>
      )}
    </div>
  );
}
