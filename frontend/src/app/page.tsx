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
import InboxView from "@/components/features/inbox/InboxView";
import { useTaskFilter } from "../hooks/useTaskFilter";
import { useMascot, fireMascotEvent } from "../hooks/useMascot";

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
  const [activeTab, setActiveTab] = useState<'tasks' | 'worktime' | 'mascot' | 'inbox'>('tasks');
  const bubbleAreaRef = useRef<HTMLDivElement>(null);
  const {taskFilter, filteredTasks, handleFilterChange, availableTags} = useTaskFilter(tasks);
  const { dialogue, visible } = useMascot('tasks');
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
    fireMascotEvent('task_created');
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
      fireMascotEvent('task_completed');
      setTimeout(() => fireMascotEvent('points_gained'), 5500);
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
    <div className="flex flex-col flex-1 bg-mist overflow-hidden">
      {/* タブバー */}
      <div className="flex items-center gap-0 px-6 bg-mist shrink-0">
        {([
          { key: 'tasks',    label: 'タスク管理',     icon: '📋' },
          { key: 'inbox',    label: '投げ込み箱',     icon: '📥' },
          { key: 'worktime', label: '作業時間記録',   icon: '⏱' },
          { key: 'mascot',   label: 'キャラクター',   icon: '🐱' },
        ] as const).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-aqua text-aqua'
                : 'border-transparent text-ink/40 hover:text-ink hover:border-ink/20'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* タスク管理タブ */}
      <div className={`${activeTab === 'tasks' ? 'grid' : 'hidden'} flex-1 min-h-0 overflow-hidden grid-cols-[1fr_2fr_1fr] xl:grid-cols-[1fr_3fr_1fr]`} onClick={handleContainerClick}>
          {/* 左列 - タスク作成 */}
          <div className="bg-white border-r border-mist p-4 xl:p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6 text-ink border-l-4 border-aqua pl-3">タスク作成</h2>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>

          {/* 中央列 - タスクバブル表示 */}
          <div className="bg-white p-4 xl:p-6 flex flex-col items-center overflow-hidden min-h-0">
            <h2 className="text-lg font-semibold mb-6 text-ink border-l-4 border-aqua pl-3 self-start">タスク一覧</h2>
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

          {/* 右列 - タスク詳細 */}
          <div className="bg-white border-l border-mist flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-4 xl:p-6">
              <h2 className="text-lg font-semibold mb-6 text-ink border-l-4 border-aqua pl-3">タスク詳細</h2>
              {selectedTask ? (
                <TaskDetail selectedTask={selectedTask} onTaskDelete={handleTaskDelete} onTaskEdit={handleTaskEdit} onTaskComplete={handleTaskComplete} />
              ) : (
                <p className="text-ink/40">タスクバブルをクリックして詳細を表示</p>
              )}
            </div>
            <div className="shrink-0 px-4 xl:px-6 pb-4 xl:pb-6">
              <Mascot mood="tasks" dialogue={dialogue} visible={visible} />
            </div>
          </div>
        </div>

      {/* 作業時間タブ */}
      <div className={activeTab === 'worktime' ? 'flex flex-1 min-h-0' : 'hidden'}>
        <WorkTimeView tasks={tasks} onTaskUpdated={handleTaskUpdated} />
      </div>

      {/* 投げ込み箱タブ */}
      <div className={activeTab === 'inbox' ? 'flex flex-1 min-h-0' : 'hidden'}>
        <InboxView onTaskCreated={handleTaskCreated} />
      </div>

      {/* キャラクタータブ */}
      <div className={activeTab === 'mascot' ? 'flex flex-1 min-h-0' : 'hidden'}>
        <MascotView />
      </div>

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
