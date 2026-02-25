'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getMascot } from '@/lib/api';

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
      <div className="relative flex items-center gap-1 text-sm font-mono select-none">
        <span
          style={{
            color: flash ? '#fff' : '#fcd34d',
            textShadow: flash ? '0 0 8px #fbbf24, 0 0 20px #f59e0b' : 'none',
            transition: 'color 0.4s ease, text-shadow 0.4s ease',
          }}
        >
          ⭐ {points} pt
        </span>

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
