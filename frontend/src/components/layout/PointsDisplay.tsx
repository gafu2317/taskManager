'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getMascot } from '@/lib/api';

function PointsHelp() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-4 h-4 rounded-full text-[10px] font-bold leading-none flex items-center justify-center select-none"
        style={{ color: '#fcd34d', border: '1px solid #fcd34d', opacity: 0.7 }}
        aria-label="ポイントの説明"
      >
        ?
      </button>

      {open && (
        <div
          className="absolute z-50 right-0 top-6 w-56 rounded-xl p-3 text-xs leading-relaxed shadow-lg"
          style={{ background: '#0d2b3e', border: '1px solid #6E828A', color: '#E3EFF3' }}
        >
          <p className="font-bold mb-1.5" style={{ color: '#fcd34d' }}>⭐ ポイントとは？</p>
          <p className="mb-2">
            <span className="font-semibold" style={{ color: '#fcd34d' }}>獲得方法</span><br />
            タスクを完了すると獲得できます。
          </p>
          <p>
            <span className="font-semibold" style={{ color: '#fcd34d' }}>使い方</span><br />
            キャラクターの性格を変えたり、ショップでアクセサリーを購入するのに使えます。
          </p>
        </div>
      )}
    </div>
  );
}

interface Gain {
  id: number;
  amount: number;
}

export default function PointsDisplay() {
  const { data: session, status } = useSession();
  const [points, setPoints] = useState<number | null>(null);
  const [gains, setGains] = useState<Gain[]>([]);
  const [flash, setFlash] = useState(false);
  const prevPointsRef = useRef<number | null>(null);
  const gainIdRef = useRef(0);

  useEffect(() => {
    if (status !== 'authenticated') return;
    getMascot(1)
      .then(d => {
        setPoints(d.current_points);
        prevPointsRef.current = d.current_points;
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const handler = (e: Event) => {
      const newPoints = (e as CustomEvent<{ points: number }>).detail.points;
      const prev = prevPointsRef.current;
      const delta = prev !== null ? newPoints - prev : 0;
      prevPointsRef.current = newPoints;
      setPoints(newPoints);

      if (delta > 0) {
        const id = ++gainIdRef.current;
        setGains(g => [...g, { id, amount: delta }]);
        setFlash(true);
        setTimeout(() => setFlash(false), 700);
        setTimeout(() => setGains(g => g.filter(x => x.id !== id)), 1600);
      }
    };
    window.addEventListener('mascot-points-updated', handler);
    return () => window.removeEventListener('mascot-points-updated', handler);
  }, []);

  if (status !== 'authenticated' || points === null) return null;

  return (
    <>
      <style>{`
        @keyframes gain-float {
          0%   { opacity: 1; transform: translateY(0) scale(1.3); }
          15%  { opacity: 1; transform: translateY(-4px) scale(1.0); }
          100% { opacity: 0; transform: translateY(-32px) scale(0.85); }
        }
        @keyframes points-glow {
          0%   { color: #fff; text-shadow: 0 0 8px #fbbf24, 0 0 20px #f59e0b; }
          100% { color: #fcd34d; text-shadow: none; }
        }
      `}</style>
      <div className="relative flex items-center gap-1.5 text-sm font-mono select-none">
        <span
          style={{
            color: flash ? '#fff' : '#fcd34d',
            textShadow: flash ? '0 0 8px #fbbf24, 0 0 20px #f59e0b' : 'none',
            transition: 'color 0.4s ease, text-shadow 0.4s ease',
          }}
        >
          ⭐ {points} pt
        </span>
        <PointsHelp />

        {gains.map(gain => (
          <span
            key={gain.id}
            className="pointer-events-none absolute right-0 whitespace-nowrap text-xs font-bold"
            style={{
              bottom: '100%',
              color: '#fde68a',
              textShadow: '0 0 6px #f59e0b, 0 1px 2px rgba(0,0,0,0.6)',
              animation: 'gain-float 1.6s ease-out forwards',
            }}
          >
            +{gain.amount} pt
          </span>
        ))}
      </div>
    </>
  );
}
