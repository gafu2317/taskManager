'use client';

import { useState } from 'react';
import { Task } from '../../../types/task';
import { createTask, deleteTask } from '../../../lib/api';

interface SubTaskDraft {
  title: string;
  description: string;
  importance: number;
  cost: number;
  tags: string[];
}

interface TaskSplitViewProps {
  tasks: Task[];
  initialTaskId?: string | null;
  onSplitComplete: () => void;
}

type Step = 'select' | 'loading' | 'edit' | 'done';

export default function TaskSplitView({ tasks, initialTaskId, onSplitComplete }: TaskSplitViewProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedTask, setSelectedTask] = useState<Task | null>(
    initialTaskId ? (tasks.find(t => t.id === initialTaskId) ?? null) : null
  );
  const [subtasks, setSubtasks] = useState<SubTaskDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSelectTask = async (task: Task) => {
    setSelectedTask(task);
    setStep('loading');
    setError(null);

    try {
      const res = await fetch('/api/split-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          importance: task.importance,
          cost: task.cost,
          tags: task.tags,
        }),
      });

      if (!res.ok) throw new Error('APIエラー');

      const data = await res.json();
      if (!data.subtasks || data.subtasks.length === 0) {
        throw new Error('サブタスクの生成に失敗しました');
      }

      setSubtasks(data.subtasks);
      setStep('edit');
    } catch (e) {
      setError(e instanceof Error ? e.message : '分割に失敗しました');
      setStep('select');
    }
  };

  const handleSubtaskChange = (index: number, field: keyof SubTaskDraft, value: string | number | string[]) => {
    setSubtasks(prev => prev.map((st, i) => i === index ? { ...st, [field]: value } : st));
  };

  const handleAddSubtask = () => {
    setSubtasks(prev => [...prev, {
      title: '',
      description: '',
      importance: 3,
      cost: 2,
      tags: selectedTask?.tags ?? [],
    }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!selectedTask || subtasks.length === 0) return;
    setIsConfirming(true);
    try {
      await Promise.all(
        subtasks
          .filter(st => st.title.trim().length > 0)
          .map(st => createTask({
            title: st.title.trim(),
            description: st.description,
            importance: st.importance,
            cost: st.cost,
            tags: st.tags,
            completed: false,
            userId: selectedTask.userId,
          }))
      );
      await deleteTask(selectedTask.id);
      onSplitComplete();
      setStep('done');
    } catch {
      setError('タスクの登録に失敗しました');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedTask(null);
    setSubtasks([]);
    setError(null);
  };

  if (step === 'done') {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="text-center space-y-4 px-8">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-semibold text-ink">分割完了！</h2>
          <p className="text-ink/60 text-sm">
            「{selectedTask?.title}」を{subtasks.filter(s => s.title.trim()).length}件のタスクに分割しました
          </p>
          <button
            onClick={handleReset}
            className="mt-4 border border-aqua text-aqua hover:bg-aqua hover:text-white px-5 py-2 text-sm transition-colors"
          >
            別のタスクを分割する
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="text-center space-y-5 px-8">
          <div className="flex justify-center">
            <div className="w-10 h-10 border-2 border-mist border-t-aqua rounded-full animate-spin" />
          </div>
          <p className="text-ink font-medium text-sm">
            「{selectedTask?.title}」を分割中...
          </p>
          <p className="text-ink/40 text-xs">AIがサブタスクを生成しています</p>
        </div>
      </div>
    );
  }

  if (step === 'edit' && selectedTask) {
    return (
      <div className="flex flex-1 flex-col bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ヘッダー */}
          <div className="border-l-4 border-aqua pl-3 mb-4">
            <p className="text-xs text-ink/40 mb-0.5">元タスクを削除し、以下に置き換えます</p>
            <p className="text-sm font-semibold text-ink">「{selectedTask.title}」</p>
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 px-3 py-2">{error}</p>
          )}

          {/* サブタスクカード一覧 */}
          <div className="space-y-3">
            {subtasks.map((st, i) => (
              <div key={i} className="border-l-2 border-aqua bg-white border border-mist p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-sage text-ink text-xs px-1.5 py-0.5 font-medium shrink-0">{i + 1}</span>
                  <input
                    value={st.title}
                    onChange={e => handleSubtaskChange(i, 'title', e.target.value)}
                    placeholder="タイトル"
                    className="flex-1 text-sm text-ink border-b border-mist bg-transparent focus:outline-none focus:border-aqua py-0.5"
                  />
                  <button
                    onClick={() => handleRemoveSubtask(i)}
                    className="text-ink/30 hover:text-ink/60 text-xs shrink-0"
                    title="削除"
                  >
                    ✕
                  </button>
                </div>
                <input
                  value={st.description}
                  onChange={e => handleSubtaskChange(i, 'description', e.target.value)}
                  placeholder="説明（任意）"
                  className="w-full text-xs text-ink/60 border-b border-mist bg-transparent focus:outline-none focus:border-aqua py-0.5"
                />
                <div className="flex items-center gap-4 text-xs text-ink/50">
                  <label className="flex items-center gap-1">
                    重要度
                    <select
                      value={st.importance}
                      onChange={e => handleSubtaskChange(i, 'importance', Number(e.target.value))}
                      className="border border-mist text-ink text-xs px-1 py-0.5 focus:outline-none focus:border-aqua"
                    >
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-1">
                    コスト
                    <select
                      value={st.cost}
                      onChange={e => handleSubtaskChange(i, 'cost', Number(e.target.value))}
                      className="border border-mist text-ink text-xs px-1 py-0.5 focus:outline-none focus:border-aqua"
                    >
                      {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                  {st.tags.length > 0 && (
                    <span className="text-ink/40">{st.tags.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 追加ボタン */}
          <button
            onClick={handleAddSubtask}
            className="w-full border border-dashed border-mist hover:border-aqua text-ink/40 hover:text-aqua text-sm py-2 transition-colors"
          >
            + タスクを追加
          </button>
        </div>

        {/* フッターボタン */}
        <div className="shrink-0 border-t border-mist px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="text-sm text-ink/40 hover:text-ink px-4 py-2 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming || subtasks.filter(s => s.title.trim()).length === 0}
            className="bg-aqua text-white text-sm px-5 py-2 hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? '処理中...' : '分割を確定する'}
          </button>
        </div>
      </div>
    );
  }

  // step === 'select'
  return (
    <div className="flex flex-1 flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="border-l-4 border-aqua pl-3 mb-6">
          <h2 className="text-lg font-semibold text-ink">タスク分割</h2>
          <p className="text-xs text-ink/40 mt-0.5">分割したいタスクをクリックしてください</p>
        </div>

        {error && (
          <p className="text-red-500 text-xs bg-red-50 border border-red-200 px-3 py-2 mb-4">{error}</p>
        )}

        {tasks.length === 0 ? (
          <p className="text-ink/40 text-sm">タスクがありません</p>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className="w-full text-left border border-mist hover:border-aqua hover:bg-sage/20 p-4 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-ink font-medium leading-snug flex-1 group-hover:text-aqua transition-colors">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 text-xs text-ink/40">
                    <span>★{task.importance}</span>
                    <span>⏱{task.cost}</span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-xs text-ink/40 mt-1 line-clamp-1">{task.description}</p>
                )}
                {task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map((tag, i) => (
                      <span key={i} className="bg-sage text-ink/60 text-xs px-1.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
