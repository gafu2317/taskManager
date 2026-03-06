'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { WorkSession } from '@/types/session';
import { createSession, getSessions, postMascotAction } from '@/lib/api';
import Mascot from '@/components/features/mascot/Mascot';
import { useMascot, fireMascotEvent } from '@/hooks/useMascot';
import BGMPlayer from './BGMPlayer';

type TimerState = 'idle' | 'working' | 'on_break';

interface WorkTimeViewProps {
  tasks: Task[];
  onTaskUpdated: () => void;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDateRange(weeks: number): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=Sun
  const startOfCurrentWeek = new Date(today);
  startOfCurrentWeek.setDate(today.getDate() - dayOfWeek);
  const start = new Date(startOfCurrentWeek);
  start.setDate(startOfCurrentWeek.getDate() - (weeks - 1) * 7);
  const end = new Date(today);
  end.setDate(today.getDate() + (6 - dayOfWeek));

  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function getColorClass(seconds: number): string {
  if (seconds === 0) return 'bg-gray-100';
  if (seconds < 30 * 60) return 'bg-blue-100';
  if (seconds < 60 * 60) return 'bg-blue-200';
  if (seconds < 2 * 60 * 60) return 'bg-blue-400';
  if (seconds < 4 * 60 * 60) return 'bg-blue-600';
  return 'bg-blue-800';
}

const WEEKS = 16;
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function WorkTimeView({ tasks, onTaskUpdated }: WorkTimeViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [segmentStart, setSegmentStart] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentSegmentSeconds, setCurrentSegmentSeconds] = useState(0);
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, number>>({});
  const [sessionDetailsByDate, setSessionDetailsByDate] = useState<Record<string, WorkSession[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const { dialogue, visible } = useMascot('worktime');

  useEffect(() => {
    const dates = getDateRange(WEEKS);
    getSessions(dates[0], dates[dates.length - 1]).then(sessions => {
      const totalMap: Record<string, number> = {};
      const detailMap: Record<string, WorkSession[]> = {};
      for (const s of sessions) {
        totalMap[s.date] = (totalMap[s.date] ?? 0) + s.workTime;
        detailMap[s.date] = [...(detailMap[s.date] ?? []), s];
      }
      setSessionsByDate(totalMap);
      setSessionDetailsByDate(detailMap);
    }).catch(() => {});
  }, []);

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

  // 30分連続作業でセリフ（timerState が 'working' になった時点からのタイマー）
  useEffect(() => {
    if (timerState !== 'working') return;
    const timer = setTimeout(() => fireMascotEvent('work_long'), 30 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [timerState]);

  const handleStart = () => {
    if (!selectedTaskId) return;
    const now = Date.now();
    setSegmentStart(now);
    setSessionStartTime(new Date(now));
    setTimerState('working');
    setWorkSeconds(0);
    setBreakSeconds(0);
    setCurrentSegmentSeconds(0);
    fireMascotEvent('work_started');
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
      const newSession = await createSession({
        taskId: selectedTaskId,
        taskTitle: selectedTask.title,
        date,
        workTime: finalWork,
        breakTime: finalBreak,
        startedAt: sessionStartTime.toISOString(),
        endedAt: endTime.toISOString(),
      });
      setSessionsByDate(prev => ({ ...prev, [date]: (prev[date] ?? 0) + finalWork }));
      setSessionDetailsByDate(prev => ({ ...prev, [date]: [...(prev[date] ?? []), newSession] }));
      fireMascotEvent('work_ended');
      setTimeout(() => fireMascotEvent('points_gained'), 5500);
      postMascotAction('work_session', finalWork).then(res => {
        if (res) window.dispatchEvent(new CustomEvent('mascot-points-updated', { detail: { points: res.current_points } }));
      }).catch(() => {});
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

  // カレンダーデータ（週ごとに分割）
  const allDates = getDateRange(WEEKS);
  const weeks: string[][] = [];
  for (let i = 0; i < allDates.length; i += 7) {
    weeks.push(allDates.slice(i, i + 7));
  }

  // 月ラベル（週の最初の日が月初なら表示）
  const monthLabels = weeks.map(week => {
    const d = new Date(week[0]);
    return d.getDate() <= 7 ? d.getMonth() + 1 : null;
  });

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 lg:p-8 gap-4 lg:gap-6 bg-gray-50">

      {/* BGM + タイマー: md では横並び、lg では lg:contents で外のflexに直接組み込む */}
      <div className="flex flex-row gap-4 lg:contents min-h-0">

        {/* BGMプレイヤー */}
        <div className="flex-1 lg:flex-1 flex flex-col min-h-0">
          <BGMPlayer />
        </div>

        {/* タイマー */}
        <div className="flex-1 lg:flex-none lg:w-[28rem] lg:shrink-0 flex flex-col gap-3 lg:gap-6 min-h-0">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">タスク</label>
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value)}
              disabled={timerState !== 'idle'}
              className="w-full p-3 lg:p-4 text-sm lg:text-base border border-gray-300 rounded-2xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">-- タスクを選んでください --</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:p-6 text-center">
            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-3 lg:mb-4">
              {statusLabel}
            </p>
            <div className="flex justify-center gap-4 lg:gap-12">
              <div>
                <p className="text-xs text-gray-400 mb-1">作業</p>
                <p className="text-3xl lg:text-5xl font-mono font-bold tabular-nums text-gray-900">
                  {formatTime(totalWorkSeconds)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">休憩</p>
                <p className="text-3xl lg:text-5xl font-mono font-bold tabular-nums text-gray-400">
                  {formatTime(totalBreakSeconds)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 lg:mt-4 lg:pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-1">このタスクの累計</p>
              <p className="text-xl lg:text-2xl font-mono font-semibold text-gray-500">
                {formatTime(selectedTask?.totalWorkTime ?? 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            <button onClick={handleStart} disabled={timerState !== 'idle' || !selectedTaskId}
              className="py-4 lg:py-7 rounded-2xl text-sm lg:text-xl font-bold text-white bg-green-500 hover:bg-green-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm">
              ▶ 作業開始
            </button>
            <button onClick={handleBreak} disabled={timerState !== 'working'}
              className="py-4 lg:py-7 rounded-2xl text-sm lg:text-xl font-bold text-white bg-amber-400 hover:bg-amber-500 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm">
              ☕ 休憩
            </button>
            <button onClick={handleResumeWork} disabled={timerState !== 'on_break'}
              className="py-4 lg:py-7 rounded-2xl text-sm lg:text-xl font-bold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm">
              ▶ 再開
            </button>
            <button onClick={handleEnd} disabled={timerState === 'idle'}
              className="py-4 lg:py-7 rounded-2xl text-sm lg:text-xl font-bold text-white bg-red-400 hover:bg-red-500 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 transition-all shadow-sm">
              ■ 終了
            </button>
          </div>
        </div>

      </div>

      {/* カレンダー＋マスコット: md では横並び（下段）、lg では縦並び（右列） */}
      <div className="flex flex-row lg:flex-col justify-center items-center gap-4 lg:flex-1 shrink-0 lg:shrink">

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:p-5 shrink-0">
          <p className="text-sm font-medium text-gray-500 mb-3">作業記録</p>

          {/* 月ラベル */}
          <div className="flex gap-1 mb-1 pl-6">
            {weeks.map((_, wi) => (
              <div key={wi} className="w-4 text-[9px] text-gray-400 text-center">
                {monthLabels[wi] ? `${monthLabels[wi]}月` : ''}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* 曜日ラベル */}
            <div className="flex flex-col gap-1 mr-1">
              {DAY_LABELS.map(d => (
                <div key={d} className="w-4 h-4 flex items-center justify-center text-[9px] text-gray-400">
                  {d}
                </div>
              ))}
            </div>

            {/* 週ごとの列 */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map(date => (
                  <div
                    key={date}
                    onClick={(e) => {
                      if (selectedDate === date) {
                        setSelectedDate(null);
                        setPopoverPos(null);
                      } else {
                        setSelectedDate(date);
                        const POPOVER_W = 208; // w-52
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const left = Math.min(Math.max(centerX - POPOVER_W / 2, 8), window.innerWidth - POPOVER_W - 8);
                        const top = rect.bottom + 8;
                        setPopoverPos({ x: left, y: top });
                      }
                    }}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-opacity hover:opacity-70 ${getColorClass(sessionsByDate[date] ?? 0)} ${selectedDate === date ? 'ring-1 ring-blue-500 ring-offset-1' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex items-center gap-1 mt-3">
            <span className="text-[9px] text-gray-400 mr-1">少</span>
            {['bg-gray-100', 'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-600', 'bg-blue-800'].map(c => (
              <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
            ))}
            <span className="text-[9px] text-gray-400 ml-1">多</span>
          </div>
        </div>

        <div className="w-52 lg:w-80 shrink-0">
          <Mascot mood="worktime" dialogue={dialogue} visible={visible} />
        </div>

      </div>

      {/* ポップアップ */}
      {selectedDate && popoverPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setSelectedDate(null); setPopoverPos(null); }} />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-52"
            style={{ left: popoverPos.x, top: popoverPos.y }}
          >
            <p className="text-xs font-semibold text-gray-600 mb-2">{selectedDate}</p>
            {(sessionDetailsByDate[selectedDate] ?? []).length === 0 ? (
              <p className="text-xs text-gray-400">記録なし</p>
            ) : (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">合計作業時間</span>
                <span className="font-mono text-blue-600 font-semibold">{formatTime(sessionsByDate[selectedDate] ?? 0)}</span>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
