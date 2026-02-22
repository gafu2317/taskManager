import { useState, useEffect } from 'react';
import { MascotMood } from '../types/mascot';
import { getDialogue, getMood } from '../lib/mascotDialogue';

export function useMascot(taskCount: number) {
  const mood = getMood(taskCount);
  const [dialogue, setDialogue] = useState<string>(() => getDialogue(mood));
  const [visible, setVisible] = useState(true);

  // タスク数が変わったらセリフを更新
  useEffect(() => {
    fadeAndChange(getMood(taskCount));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskCount]);

  // 12秒ごとにセリフをローテーション
  useEffect(() => {
    const interval = setInterval(() => {
      fadeAndChange(mood);
    }, 12000);
    return () => clearInterval(interval);
  }, [mood]);

  function fadeAndChange(m: MascotMood) {
    setVisible(false);
    setTimeout(() => {
      setDialogue(getDialogue(m));
      setVisible(true);
    }, 200);
  }

  return { mood, dialogue, visible };
}
