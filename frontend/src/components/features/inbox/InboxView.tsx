'use client';

import { useState, useEffect, useRef } from 'react';
import TaskForm from '../tasks/TaskForm';
import Mascot from '../mascot/Mascot';
import { useMascotDialogue, fireMascotEvent } from '@/hooks/useMascot';

type InboxItem = {
  id: string;
  title: string;
  createdAt: string;
};

const STORAGE_KEY = 'inbox_items';

function loadItems(): InboxItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InboxItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(items: InboxItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}

interface InboxViewProps {
  onTaskCreated: () => void;
}

export default function InboxView({ onTaskCreated }: InboxViewProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const { dialogue, visible: mascotVisible } = useMascotDialogue('inbox');
  const [input, setInput] = useState('');
  const [promotingItem, setPromotingItem] = useState<InboxItem | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const addItem = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const newItem: InboxItem = {
      id: crypto.randomUUID(),
      title: trimmed,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    setItems(updated);
    saveItems(updated);
    setInput('');
    textareaRef.current?.focus();
    fireMascotEvent('inbox_added');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      addItem();
    }
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveItems(updated);
    if (updated.length === 0) fireMascotEvent('inbox_empty');
  };

  const handlePromoted = () => {
    if (promotingItem) {
      deleteItem(promotingItem.id);
      setPromotingItem(null);
      onTaskCreated();
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 左カラム: 入力エリア (20%) */}
      <div className="w-1/5 bg-white border-r border-mist p-6 flex flex-col gap-4 overflow-hidden">
        <h2 className="text-lg font-semibold text-ink border-l-4 border-aqua pl-3">投げ込む</h2>
        <p className="text-xs text-ink/40 leading-relaxed">
          まだ深く考えていないアイデアやタスク候補をここに書き留めておきましょう。後で整理できます。
        </p>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="思いついたことを入力…&#10;Enterで追加、Shift+Enterで改行"
          rows={5}
          className="w-full border border-mist rounded px-3 py-2 text-sm text-ink placeholder:text-ink/30 resize-none focus:outline-none focus:border-aqua transition-colors"
        />
        <button
          onClick={addItem}
          disabled={!input.trim()}
          className="w-full py-2 text-sm font-medium border border-aqua text-aqua rounded hover:bg-aqua hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          追加
        </button>
        <div className="mt-auto pt-4">
          <Mascot mood="inbox" dialogue={dialogue} visible={mascotVisible} />
        </div>
      </div>

      {/* 右カラム: リスト (80%) */}
      <div className="flex-1 bg-white p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-6 text-ink border-l-4 border-aqua pl-3">
          投げ込み箱
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-ink/40">({items.length}件)</span>
          )}
        </h2>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-ink/30">
            <span className="text-4xl">📥</span>
            <p className="text-sm">まだアイテムがありません</p>
            <p className="text-xs">左のエリアからアイデアを投げ込んでみましょう</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 border border-mist rounded hover:border-aqua/30 transition-colors group"
              >
                <span className="flex-1 text-sm text-ink">{item.title}</span>
                <span className="text-xs text-ink/30 shrink-0">{relativeTime(item.createdAt)}</span>
                <button
                  onClick={() => setPromotingItem(item)}
                  className="shrink-0 text-xs px-3 py-1 border border-aqua text-aqua rounded hover:bg-aqua hover:text-white transition-colors"
                >
                  タスクにする
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="shrink-0 text-ink/30 hover:text-red-400 transition-colors text-lg leading-none"
                  aria-label="削除"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 昇格モーダル */}
      {promotingItem && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setPromotingItem(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-ink border-l-4 border-aqua pl-3">タスクとして整理</h3>
              <button
                onClick={() => setPromotingItem(null)}
                className="text-ink/30 hover:text-ink transition-colors text-xl leading-none"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <TaskForm
              initialTitle={promotingItem.title}
              onTaskCreated={handlePromoted}
            />
          </div>
        </div>
      )}
    </div>
  );
}
