'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { createSession } from '@/lib/api';

type TimerState = 'idle' | 'working' | 'on_break';

interface WorkTimeViewProps {
  tasks: Task[];
  onTaskUpdated: () => void;
}

export default function WorkTimeView({ tasks, onTaskUpdated }: WorkTimeViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [segmentStart, setSegmentStart] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentSegmentSeconds, setCurrentSegmentSeconds] = useState(0);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
    if (timerState === 'idle' || segmentStart === null) return;
    const interval = setInterval(() => {
      setCurrentSegmentSeconds(Math.floor((Date.now() - segmentStart) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [timerState, segmentStart]);

  const totalWorkSeconds =
    timerState === 'working' ? workSeconds + currentSegmentSeconds : workSeconds;
  const totalBreakSeconds =
    timerState === 'on_break' ? breakSeconds + currentSegmentSeconds : breakSeconds;

  const handleStart = () => {
    if (!selectedTaskId) return;
    const now = Date.now();
    setSegmentStart(now);
    setSessionStartTime(new Date(now));
    setTimerState('working');
    setWorkSeconds(0);
    setBreakSeconds(0);
    setCurrentSegmentSeconds(0);
  };

  const handleBreak = () => {
    const elapsed = segmentStart ? Math.floor((Date.now() - segmentStart) / 1000) : 0;
    setWorkSeconds(prev => prev + elapsed);
    setSegmentStart(Date.now());
    setCurrentSegmentSeconds(0);
    setTimerState('on_break');
  };

  const handleResumeWork = () => {
    const elapsed = segmentStart ? Math.floor((Date.now() - segmentStart) / 1000) : 0;
    setBreakSeconds(prev => prev + elapsed);
    setSegmentStart(Date.now());
    setCurrentSegmentSeconds(0);
    setTimerState('working');
  };

  const handleEnd = async () => {
    const endTime = new Date();
    const elapsed = segmentStart ? Math.floor((Date.now() - segmentStart) / 1000) : 0;
    let finalWork = workSeconds;
    let finalBreak = breakSeconds;
    if (timerState === 'working') finalWork += elapsed;
    if (timerState === 'on_break') finalBreak += elapsed;

    if (selectedTaskId && selectedTask && sessionStartTime) {
      const date = sessionStartTime.toISOString().slice(0, 10);
      await createSession({
        taskId: selectedTaskId,
        taskTitle: selectedTask.title,
        date,
        workTime: finalWork,
        breakTime: finalBreak,
        startedAt: sessionStartTime.toISOString(),
        endedAt: endTime.toISOString(),
      });
      onTaskUpdated();
    }

    setTimerState('idle');
    setWorkSeconds(0);
    setBreakSeconds(0);
    setSegmentStart(null);
    setSessionStartTime(null);
    setCurrentSegmentSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const statusLabel = { idle: 'アイドル', working: '作業中', on_break: '休憩中' }[timerState];

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-lg flex flex-col gap-6">

        {/* タスク選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">タスク</label>
          <select
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            disabled={timerState !== 'idle'}
            className="w-full p-4 text-base border border-gray-300 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">-- タスクを選んでください --</option>
            {tasks.map(task => (
              <option key={task.id} value={task.id}>{task.title}</option>
            ))}
          </select>
        </div>

        {/* タイマー表示 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-4">
            {statusLabel}
          </p>
          <div className="flex justify-center gap-12">
            <div>
              <p className="text-xs text-gray-400 mb-1">作業</p>
              <p className="text-5xl font-mono font-bold tabular-nums text-gray-900">
                {formatTime(totalWorkSeconds)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">休憩</p>
              <p className="text-5xl font-mono font-bold tabular-nums text-gray-400">
                {formatTime(totalBreakSeconds)}
              </p>
            </div>
          </div>

        </div>

        {/* ボタン（常時表示） */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleStart}
            disabled={timerState !== 'idle' || !selectedTaskId}
            className="py-7 rounded-2xl text-xl font-bold text-white bg-green-500 hover:bg-green-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm"
          >
            ▶ 作業開始
          </button>
          <button
            onClick={handleBreak}
            disabled={timerState !== 'working'}
            className="py-7 rounded-2xl text-xl font-bold text-white bg-amber-400 hover:bg-amber-500 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm"
          >
            ☕ 休憩
          </button>
          <button
            onClick={handleResumeWork}
            disabled={timerState !== 'on_break'}
            className="py-7 rounded-2xl text-xl font-bold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm"
          >
            ▶ 再開
          </button>
          <button
            onClick={handleEnd}
            disabled={timerState === 'idle'}
            className="py-7 rounded-2xl text-xl font-bold text-white bg-red-400 hover:bg-red-500 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm"
          >
            ■ 終了
          </button>
        </div>

      </div>
    </div>
  );
}
