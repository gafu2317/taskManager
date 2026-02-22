import { useState, useEffect, useRef } from 'react';
import { MascotMood } from '../types/mascot';
import { getDialogue } from '../lib/mascotDialogue';

export function useMascot(mood: MascotMood) {
  const [dialogue, setDialogue] = useState<string>(() => getDialogue(mood));
  const [visible, setVisible] = useState(true);
  const prevMoodRef = useRef(mood);

  // ムードが変わったらセリフを更新
  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      fadeAndChange(mood);
    }
  }, [mood]);

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

  return { dialogue, visible };
}
