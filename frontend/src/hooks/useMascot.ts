'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MascotMood, MascotData } from '../types/mascot';
import { getDialogue } from '../lib/mascotDialogue';
import {
  getMascot,
  postMascotAction,
  postMascotPreset,
  postMascotShopBuy,
  putMascotEquip,
  unlockMascotSlot,
} from '../lib/api';

// ─── セリフ制御フック（既存の useMascot を改名） ───────────────────────

export function useMascotDialogue(mood: MascotMood) {
  const [dialogue, setDialogue] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const prevMoodRef = useRef(mood);

  // 初回マウント後にセリフをセット（SSR hydration mismatch 回避）
  useEffect(() => {
    setDialogue(getDialogue(mood));
    setVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

// 後方互換: 既存コードが useMascot(mood) と呼んでいるため残す
export function useMascot(mood: MascotMood) {
  return useMascotDialogue(mood);
}

// ─── データ管理フック ─────────────────────────────────────────────────

const DEFAULT_MASCOT_DATA: MascotData = {
  user_id: '',
  current_points: 0,
  total_earned_points: 0,
  personality_preset: 'flat',
  unlocked_presets: ['flat'],
  owned_accessories: [],
  equipped_accessories: [],
  last_login_date: '',
  unlocked_slots: 1,
  created_at: '',
  updated_at: '',
};

export function useMascotData(slot = 1) {
  const [mascotData, setMascotData] = useState<MascotData>(DEFAULT_MASCOT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (slot === 1) {
          const data = await getMascot(1);
          setMascotData(data);
          await postMascotAction('login');
          const updated = await getMascot(1);
          setMascotData(updated);
        } else {
          const data = await getMascot(slot);
          setMascotData(data);
        }
      } catch {
        // 未ログイン時はエラーを無視
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slot]);

  const updatePreset = useCallback(async (presetId: string) => {
    const updated = await postMascotPreset(presetId, slot);
    setMascotData(updated);
  }, [slot]);

  const buyAccessory = useCallback(async (accessoryId: string) => {
    const updated = await postMascotShopBuy(accessoryId, slot);
    setMascotData(updated);
  }, [slot]);

  const updateEquip = useCallback(async (equipped: string[]) => {
    const updated = await putMascotEquip(equipped, slot);
    setMascotData(updated);
  }, [slot]);

  const addPoints = useCallback(async (
    type: 'task_complete' | 'work_session',
    workSeconds?: number
  ) => {
    await postMascotAction(type, workSeconds);
    const updated = await getMascot(slot);
    setMascotData(updated);
  }, [slot]);

  return {
    mascotData,
    loading,
    updatePreset,
    buyAccessory,
    updateEquip,
    addPoints,
  };
}
