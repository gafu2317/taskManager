'use client';

import { useState } from 'react';
import { createTask } from '../../../lib/api';

interface SubTaskDraft {
  title: string;
  description: string;
  importance: number;
  cost: number;
  tags: string[];
}

interface TaskSplitViewProps {
  onSplitComplete: () => void;
}

type Step = 'input' | 'loading' | 'edit' | 'done';

export default function TaskSplitView({ onSplitComplete }: TaskSplitViewProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputTitle, setInputTitle] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [inputTagsRaw, setInputTagsRaw] = useState('');
  const [subtasks, setSubtasks] = useState<SubTaskDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const parsedTags = inputTagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  const handleSplit = async () => {
    if (!inputTitle.trim() || step === 'loading') return;
    setStep('loading');
    setError(null);

    try {
      const res = await fetch('/api/split-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inputTitle,
          description: inputDescription,
          tags: parsedTags,
        }),
      });

      if (!res.ok) throw new Error(`APIエラー (${res.status})`);

      const data = await res.json();
      console.log('split-task response:', JSON.stringify(data, null, 2));
      if (!data.subtasks || data.subtasks.length === 0) {
        throw new Error('サブタスクを生成できませんでした。開発者ツールのコンソールを確認してください');
      }

      setSubtasks(data.subtasks);
      setStep('edit');
    } catch (e) {
      setError(e instanceof Error ? e.message : '分割に失敗しました');
      setStep('input');
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
      tags: parsedTags,
    }]);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (subtasks.length === 0) return;
    setIsConfirming(true);
    try {
      const validSubtasks = subtasks.filter(st => st.title.trim().length > 0);
      await Promise.all(
        validSubtasks.map(st => createTask({
          title: st.title.trim(),
          description: st.description,
          importance: st.importance,
          cost: st.cost,
          tags: st.tags,
          completed: false,
          userId: '',
        }))
      );
      onSplitComplete();
      setDoneCount(validSubtasks.length);
      setStep('done');
    } catch {
      setError('タスクの登録に失敗しました');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setInputTitle('');
    setInputDescription('');
    setInputTagsRaw('');
    setSubtasks([]);
    setError(null);
  };

  const validCount = subtasks.filter(s => s.title.trim()).length;

  return (
    <div className="grid flex-1 min-h-0 overflow-hidden grid-cols-[1fr_2fr]">
      {/* 左カラム: 入力パネル */}
      <div className="bg-white border-r border-mist p-4 xl:p-6 flex flex-col gap-4 overflow-y-auto">
        <h2 className="shrink-0 text-lg font-semibold text-ink border-l-4 border-aqua pl-3">タスク分割</h2>
        <p className="hidden xl:block shrink-0 text-xs text-ink/40 leading-relaxed">
          大きなタスクをAIが具体的なサブタスクに分割します
        </p>

        {error && (
          <p className="shrink-0 text-red-500 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</p>
        )}

        <div>
          <label className="block text-xs text-ink/60 mb-1">タイトル <span className="text-red-400">*</span></label>
          <input
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
            placeholder="例: ボイチェンをしてみたい"
            className="w-full border border-mist rounded px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-aqua"
          />
        </div>

        <div>
          <label className="block text-xs text-ink/60 mb-1">説明（任意）</label>
          <textarea
            value={inputDescription}
            onChange={e => setInputDescription(e.target.value)}
            placeholder="詳細や背景を書くとより精度が上がります"
            rows={3}
            className="w-full border border-mist rounded px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-aqua resize-none"
          />
        </div>

        <div>
          <label className="block text-xs text-ink/60 mb-1">タグ（カンマ区切り、任意）</label>
          <input
            value={inputTagsRaw}
            onChange={e => setInputTagsRaw(e.target.value)}
            placeholder="例: 大学, 趣味"
            className="w-full border border-mist rounded px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-aqua"
          />
        </div>

        <button
          onClick={handleSplit}
          disabled={!inputTitle.trim() || step === 'loading'}
          className="w-full shrink-0 py-2 text-sm font-medium border border-aqua text-aqua rounded hover:bg-aqua hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {step === 'loading' ? '分割中...' : 'AIで分割する'}
        </button>

        <div className="flex-1 min-h-0" />
      </div>

      {/* 右カラム: 結果パネル */}
      <div className="bg-white p-4 xl:p-6 flex flex-col overflow-hidden">
        <h2 className="shrink-0 text-lg font-semibold mb-4 text-ink border-l-4 border-aqua pl-3">分割結果</h2>

        {/* 空状態 */}
        {step === 'input' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink/30">
            <span className="text-4xl">✂️</span>
            <p className="text-sm">左でタイトルを入力してAIで分割してください</p>
          </div>
        )}

        {/* ローディング */}
        {step === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-2 border-mist border-t-aqua rounded-full animate-spin" />
            <p className="text-sm text-ink/60">「{inputTitle}」を分割中...</p>
            <p className="text-xs text-ink/30">AIがサブタスクを生成しています</p>
          </div>
        )}

        {/* 編集 */}
        {step === 'edit' && (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {subtasks.map((st, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 border border-mist rounded hover:border-aqua/40 transition-colors group"
                >
                  <span className="mt-0.5 bg-sage text-ink text-xs w-5 h-5 flex items-center justify-center rounded shrink-0 font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      value={st.title}
                      onChange={e => handleSubtaskChange(i, 'title', e.target.value)}
                      placeholder="タイトル"
                      className="w-full text-sm text-ink bg-transparent focus:outline-none border-b border-transparent focus:border-mist"
                    />
                    <div className="flex items-center gap-3 text-xs text-ink/40">
                      <input
                        value={st.description}
                        onChange={e => handleSubtaskChange(i, 'description', e.target.value)}
                        placeholder="説明（任意）"
                        className="flex-1 bg-transparent focus:outline-none text-ink/50 min-w-0"
                      />
                      <label className="shrink-0 flex items-center gap-0.5">
                        ★
                        <select
                          value={st.importance}
                          onChange={e => handleSubtaskChange(i, 'importance', Number(e.target.value))}
                          className="border border-mist text-ink text-xs px-1 py-0.5 focus:outline-none focus:border-aqua rounded"
                        >
                          {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </label>
                      <label className="shrink-0 flex items-center gap-0.5">
                        ⏱
                        <select
                          value={st.cost}
                          onChange={e => handleSubtaskChange(i, 'cost', Number(e.target.value))}
                          className="border border-mist text-ink text-xs px-1 py-0.5 focus:outline-none focus:border-aqua rounded"
                        >
                          {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSubtask(i)}
                    className="opacity-0 group-hover:opacity-100 text-ink/30 hover:text-ink/60 text-xs transition-opacity shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddSubtask}
                className="w-full text-xs text-ink/30 hover:text-ink/60 py-2 border border-dashed border-mist hover:border-aqua/40 rounded transition-colors"
              >
                + ステップを追加
              </button>
            </div>

            <div className="shrink-0 pt-4 border-t border-mist flex justify-between items-center">
              <button
                onClick={handleReset}
                className="text-sm text-ink/40 hover:text-ink transition-colors"
              >
                やり直す
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming || validCount === 0}
                className="text-sm bg-aqua text-white px-5 py-2 rounded hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? '処理中...' : `${validCount}件を登録する`}
              </button>
            </div>
          </>
        )}

        {/* 完了 */}
        {step === 'done' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-4xl">✅</div>
            <p className="font-semibold text-ink">{doneCount}件のタスクを登録しました</p>
            <button
              onClick={handleReset}
              className="text-sm border border-aqua text-aqua hover:bg-aqua hover:text-white px-5 py-2 rounded transition-colors"
            >
              別のタスクを分割する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
