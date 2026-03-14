'use client';

import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitRecord, HabitCompletedType } from '../../../types/habit';
import { getHabits, createHabit, deleteHabit, graduateHabit, upsertHabitRecord, getHabitRecords } from '../../../lib/api';
import { fireMascotEvent } from '../../../lib/mascotDialogue';
import Mascot from '../mascot/Mascot';
import { useMascot } from '../../../hooks/useMascot';

function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcStreak(records: HabitRecord[]): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toLocalDate(d);
    if (records.some(r => r.date === dateStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getToday(): string {
  return toLocalDate(new Date());
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toLocalDate(d));
  }
  return days;
}

export default function HabitView() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [allRecords, setAllRecords] = useState<Record<string, HabitRecord[]>>({});
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newMini, setNewMini] = useState('');
  const [newFull, setNewFull] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [graduatingHabit, setGraduatingHabit] = useState<Habit | null>(null);
  const { dialogue, visible } = useMascot('habits');

  const today = getToday();

  const loadHabits = useCallback(async () => {
    try {
      const fetched = await getHabits();
      setHabits(fetched);
      // 全習慣の記録を取得
      const recordMap: Record<string, HabitRecord[]> = {};
      await Promise.all(
        fetched.map(async (h) => {
          const recs = await getHabitRecords(h.id);
          recordMap[h.id] = recs;
        })
      );
      setAllRecords(recordMap);
    } catch (e) {
      console.error('Failed to load habits:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, []);

  // 選択中の習慣が削除・卒業で消えた場合のみ null にリセット
  useEffect(() => {
    if (selectedHabitId && !habits.find(h => h.id === selectedHabitId && !h.graduated)) {
      setSelectedHabitId(null);
    }
  }, [habits, selectedHabitId]);

  const handleAddHabit = async () => {
    if (!newTitle.trim()) return;
    try {
      const created = await createHabit({
        title: newTitle.trim(),
        miniVersion: newMini.trim(),
        fullVersion: newFull.trim(),
      });
      const newHabits = [...habits, created];
      setHabits(newHabits);
      setAllRecords(prev => ({ ...prev, [created.id]: [] }));
      setSelectedHabitId(created.id);
      setNewTitle('');
      setNewMini('');
      setNewFull('');
    } catch (e) {
      console.error('Failed to create habit:', e);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteHabit(id);
      const updated = habits.filter(h => h.id !== id);
      setHabits(updated);
      setAllRecords(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDeletingHabit(null);
    } catch (e) {
      console.error('Failed to delete habit:', e);
    }
  };

  const handleGraduate = async (habit: Habit) => {
    const records = allRecords[habit.id] ?? [];
    const peakStreak = calcStreak(records);
    try {
      const updated = await graduateHabit(habit.id, peakStreak);
      const newHabits = habits.map(h => h.id === updated.id ? updated : h);
      setHabits(newHabits);
      // 卒業後は別のアクティブ習慣を選択
      const nextActive = newHabits.find(h => !h.graduated && h.id !== habit.id);
      setSelectedHabitId(nextActive?.id ?? null);
      setGraduatingHabit(null);
      fireMascotEvent('habit_graduated');
    } catch (e) {
      console.error('Failed to graduate habit:', e);
    }
  };

  const handleComplete = async (habitId: string, type: HabitCompletedType) => {
    try {
      await upsertHabitRecord(habitId, today, type);
      setSelectedHabitId(habitId);
      fireMascotEvent(type === 'mini' ? 'habit_complete_mini' : 'habit_complete_full');
      const updated = await getHabitRecords(habitId);
      const streak = calcStreak(updated);
      if (streak > 0 && streak % 7 === 0) {
        setTimeout(() => fireMascotEvent('habit_streak_7'), 5500);
      }
      setAllRecords(prev => ({ ...prev, [habitId]: updated }));
    } catch (e) {
      console.error('Failed to complete habit:', e);
    }
  };

  const activeHabits = habits.filter(h => !h.graduated);
  const graduatedHabits = habits.filter(h => h.graduated);
  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  const selectedRecords = selectedHabitId ? (allRecords[selectedHabitId] ?? []) : [];
  const heatmapDays = getLast30Days();

  return (
    <>
    <div className="grid flex-1 min-h-0 overflow-hidden grid-cols-[1fr_2fr_1fr] xl:grid-cols-[1fr_3fr_1fr]">
      {/* 左列: 習慣追加フォーム + ホール・オブ・フェーム */}
      <div className="bg-white border-r border-mist flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 xl:p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink border-l-4 border-aqua pl-3">習慣を追加</h2>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-ink/40 mb-1 block">習慣名</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="例: 腕立て伏せ"
                className="w-full border border-mist rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-aqua"
              />
            </div>
            <div>
              <label className="text-xs text-ink/40 mb-1 block">ミニ版（最小行動）</label>
              <input
                type="text"
                value={newMini}
                onChange={e => setNewMini(e.target.value)}
                placeholder="例: 腕立て1回"
                className="w-full border border-mist rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-aqua"
              />
            </div>
            <div>
              <label className="text-xs text-ink/40 mb-1 block">フル版（理想の量）</label>
              <input
                type="text"
                value={newFull}
                onChange={e => setNewFull(e.target.value)}
                placeholder="例: 腕立て30回"
                className="w-full border border-mist rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-aqua"
              />
            </div>
            <button
              onClick={handleAddHabit}
              disabled={!newTitle.trim()}
              className="w-full bg-blue-500 text-white rounded py-2 text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              追加する
            </button>
          </div>

          {/* ホール・オブ・フェーム */}
          {graduatedHabits.length > 0 && (
            <div className="border-t border-mist pt-4">
              <p className="text-xs font-semibold text-ink/50 mb-3 tracking-wider">🏆 習慣化した記録</p>
              <div className="flex flex-wrap gap-3">
                {graduatedHabits.map(habit => (
                  <div key={habit.id} className="relative group">
                    <div
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-yellow-50 border-2 border-yellow-200 text-3xl shadow-sm"
                    >
                      🏅
                    </div>
                    {/* ホバーツールチップ */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-ink text-white text-xs rounded-md px-3 py-2 whitespace-nowrap shadow-lg">
                        <p className="font-semibold text-sm">{habit.title}</p>
                        {habit.peakStreak > 0 && (
                          <p className="text-white/70 mt-0.5">最高 {habit.peakStreak}日連続</p>
                        )}
                        {habit.graduatedAt && (
                          <p className="text-white/50">{habit.graduatedAt} 卒業</p>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-ink" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 中央列: 習慣リスト */}
      <div className="bg-white p-4 xl:p-6 flex flex-col overflow-hidden min-h-0">
        <h2 className="text-lg font-semibold mb-4 text-ink border-l-4 border-aqua pl-3 shrink-0">
          今日の習慣 <span className="text-sm text-ink/40 font-normal ml-2">{today}</span>
        </h2>

        {loading ? (
          <p className="text-ink/40 text-sm">読み込み中...</p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* アクティブな習慣 */}
            {activeHabits.length === 0 && graduatedHabits.length === 0 && (
              <p className="text-ink/40 text-sm">習慣がまだありません。左のフォームから追加してください。</p>
            )}
            {activeHabits.map(habit => {
              const records = allRecords[habit.id] ?? [];
              const todayRecord = records.find(r => r.date === today);
              const streak = calcStreak(records);
              const isMiniDone = todayRecord?.completed === 'mini' || todayRecord?.completed === 'full';
              const isFullDone = todayRecord?.completed === 'full';

              return (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabitId(habit.id)}
                  className={`border rounded p-3 cursor-pointer transition-colors ${
                    selectedHabitId === habit.id
                      ? 'border-aqua bg-sage/30'
                      : 'border-mist hover:border-aqua/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-ink">{habit.title}</span>
                    <div className="flex items-center gap-2">
                      {streak > 0 && (
                        <span className="text-xs text-ink/60 flex items-center gap-1">
                          🔥 {streak}日
                        </span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); setGraduatingHabit(habit); }}
                        title="習慣化完了・卒業する"
                        className="text-yellow-400 hover:text-yellow-500 text-sm transition-colors"
                      >
                        🎓
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingHabit(habit); }}
                        className="text-red-300 hover:text-red-500 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {/* ミニ版 */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink/60 flex-1 min-w-0 truncate">
                        {habit.miniVersion || 'ミニ版未設定'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); if (!isMiniDone) handleComplete(habit.id, 'mini'); }}
                        disabled={isMiniDone}
                        className={`shrink-0 text-xs px-2.5 py-1 rounded border transition-colors ${
                          isMiniDone
                            ? 'border-yellow-300 text-yellow-500 bg-yellow-50 cursor-default'
                            : 'border-yellow-400 text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        {isMiniDone ? '✓ ミニ達成' : 'ミニで達成'}
                      </button>
                    </div>

                    {/* フル版 */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink/60 flex-1 min-w-0 truncate">
                        {habit.fullVersion || 'フル版未設定'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); if (!isFullDone) handleComplete(habit.id, 'full'); }}
                        disabled={isFullDone}
                        className={`shrink-0 text-xs px-2.5 py-1 rounded transition-colors ${
                          isFullDone
                            ? 'bg-green-200 text-green-600 cursor-default'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {isFullDone ? '✓ フル達成' : 'フルで達成'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* 右列: ヒートマップ */}
      <div className="bg-white border-l border-mist flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-4 xl:p-6">
          <h2 className="text-lg font-semibold mb-4 text-ink border-l-4 border-aqua pl-3">
            達成記録
          </h2>

          {selectedHabit ? (
            <div>
              <p className="text-sm font-medium text-ink mb-3">{selectedHabit.title}</p>

              {/* 30日ヒートマップ */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {/* 曜日ヘッダー */}
                {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                  <div key={d} className="text-center text-xs text-ink/30 pb-1">{d}</div>
                ))}

                {/* 先頭の空白（最初の日の曜日に合わせる） */}
                {(() => {
                  const firstDay = new Date(heatmapDays[0]);
                  const dayOfWeek = firstDay.getDay(); // 0=日
                  return Array.from({ length: dayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ));
                })()}

                {heatmapDays.map(day => {
                  const record = selectedRecords.find(r => r.date === day);
                  const isToday = day === today;
                  let bgClass = 'bg-mist';
                  if (record?.completed === 'full') bgClass = 'bg-green-400';
                  else if (record?.completed === 'mini') bgClass = 'bg-yellow-300';

                  return (
                    <div
                      key={day}
                      title={`${day}${record ? ` (${record.completed === 'full' ? 'フル' : 'ミニ'}達成)` : ''}`}
                      className={`aspect-square rounded-sm ${bgClass} ${isToday ? 'ring-1 ring-aqua ring-offset-1' : ''}`}
                    />
                  );
                })}
              </div>

              {/* 凡例 */}
              <div className="flex items-center gap-3 text-xs text-ink/40">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-mist" />
                  未達成
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-yellow-300" />
                  ミニ
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-green-400" />
                  フル
                </div>
              </div>

              {/* ストリーク表示 */}
              {(() => {
                const streak = calcStreak(selectedRecords);
                return streak > 0 ? (
                  <div className="mt-4 p-3 bg-sage/30 rounded border border-mist">
                    <p className="text-sm text-ink">
                      🔥 <span className="font-semibold text-aqua">{streak}日</span> 連続達成中
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <p className="text-ink/40 text-sm">習慣を選択すると記録が表示されます</p>
          )}
        </div>

        <div className="shrink-0 px-4 xl:px-6 pb-4 xl:pb-6">
          <Mascot mood="habits" dialogue={dialogue} visible={visible} />
        </div>
      </div>
    </div>

    {/* 卒業確認モーダル */}
    {graduatingHabit && (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={() => setGraduatingHabit(null)}
      >
        <div
          className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <span className="text-4xl">🎓</span>
          </div>
          <p className="text-sm font-medium text-ink mb-1 text-center">習慣化おめでとうございます！</p>
          <p className="text-sm text-ink/60 mb-5 text-center">
            「{graduatingHabit.title}」を卒業してホール・オブ・フェームに飾りますか？
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setGraduatingHabit(null)}
              className="px-4 py-2 text-sm text-ink/60 border border-mist rounded hover:bg-mist/50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => handleGraduate(graduatingHabit)}
              className="px-4 py-2 text-sm text-white bg-yellow-400 rounded hover:bg-yellow-500 transition-colors font-medium"
            >
              🏆 卒業する
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 削除確認モーダル */}

    {deletingHabit && (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={() => setDeletingHabit(null)}
      >
        <div
          className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-ink mb-1">習慣を削除しますか？</p>
          <p className="text-sm text-ink/60 mb-5">
            「{deletingHabit.title}」と達成記録がすべて消えます。
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setDeletingHabit(null)}
              className="px-4 py-2 text-sm text-ink/60 border border-mist rounded hover:bg-mist/50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => handleDeleteHabit(deletingHabit.id)}
              className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
