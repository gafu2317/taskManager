'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getMascot } from '@/lib/api';

export default function PointsDisplay() {
  const { data: session, status } = useSession();
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    getMascot(1)
      .then(d => setPoints(d.current_points))
      .catch(() => {});
  }, [status]);

  // useMascotData からのポイント更新イベントを受け取る
  useEffect(() => {
    const handler = (e: Event) => {
      setPoints((e as CustomEvent<{ points: number }>).detail.points);
    };
    window.addEventListener('mascot-points-updated', handler);
    return () => window.removeEventListener('mascot-points-updated', handler);
  }, []);

  if (status !== 'authenticated' || points === null) return null;

  return (
    <div className="flex items-center gap-1 text-sm font-mono text-amber-300">
      <span>⭐</span>
      <span>{points} pt</span>
    </div>
  );
}
