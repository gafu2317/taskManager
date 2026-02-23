'use client';

import { useState, useEffect } from 'react';
import Mascot from './Mascot';
import { useMascotDialogue, useMascotData } from '@/hooks/useMascot';
import { getMascot, unlockMascotSlot } from '@/lib/api';
import {
  PERSONALITY_PARAMS,
  PersonalityParams,
  calcPersonalityCost,
  DEFAULT_PERSONALITY_PARAMS,
  MAX_SLOTS,
  SLOT_UNLOCK_COSTS,
} from '@/types/mascot';

const SLOT_COLORS = ['', 'bg-blue-100 border-blue-400', 'bg-pink-100 border-pink-400', 'bg-green-100 border-green-400'];
const SLOT_LABELS = ['', 'キャラ 1', 'キャラ 2', 'キャラ 3'];

export default function MascotView() {
  const [activeSlot, setActiveSlot] = useState(1);
  const [unlockedSlots, setUnlockedSlots] = useState(1);
  const [unlocking, setUnlocking] = useState(false);

  const { mascotData, loading, updatePersonality } = useMascotData(activeSlot);
  const { dialogue, visible } = useMascotDialogue('idle');

  const [params, setParams] = useState<PersonalityParams | null>(null);
  const [saving, setSaving] = useState(false);
  // スロット1から解放済みスロット数を取得
  useEffect(() => {
    getMascot(1)
      .then(d => setUnlockedSlots(d.unlocked_slots || 1))
      .catch(() => {});
  }, []);

  const currentParams = params ?? mascotData.personality_params;
  const oldCost = calcPersonalityCost(mascotData.personality_params);
  const newCost = calcPersonalityCost(currentParams);
  const diff = newCost - oldCost;
  const availablePoints = mascotData.current_points - diff;
  const canSave = availablePoints >= 0 && params !== null;

  const handleParamChange = (key: keyof PersonalityParams, value: number) => {
    setParams(prev => ({ ...(prev ?? mascotData.personality_params), [key]: value }));
  };

  const handleReset = () => setParams(DEFAULT_PERSONALITY_PARAMS);

  const handleSave = async () => {
    if (!canSave || !params) return;
    setSaving(true);
    try {
      await updatePersonality(params);
      setParams(null);
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async (slot: number) => {
    setUnlocking(true);
    try {
      await unlockMascotSlot(slot);
      setUnlockedSlots(slot);
      setActiveSlot(slot);
    } catch (e) {
      alert(e instanceof Error ? e.message : '解放に失敗しました');
    } finally {
      setUnlocking(false);
    }
  };

  // スロット切り替え時に編集中のパラメータをリセット
  const handleSlotChange = (slot: number) => {
    setActiveSlot(slot);
    setParams(null);
  };

  // スロット1のポイント（解放コスト判定用）
  const slot1Points = activeSlot === 1 ? mascotData.current_points : null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">

      {/* メインコンテンツ（3カラム） */}
      <div className="flex flex-1 overflow-hidden">

        {/* 左列: 性格設定 */}
        <div className="w-1/3 flex flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-700 mb-4">性格設定</h2>

            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-gray-500">所持ポイント</span>
                <span className="font-mono font-bold">{mascotData.current_points} pt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">使用中</span>
                <span className={`font-mono font-bold ${newCost > mascotData.current_points + oldCost ? 'text-red-500' : 'text-blue-500'}`}>
                  {newCost} pt
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">保存後の残高</span>
                <span className={`font-mono font-bold ${availablePoints < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                  {availablePoints} pt
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {PERSONALITY_PARAMS.map(({ key, name, lowLabel, highLabel }) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                    <span className="text-sm font-mono text-gray-500">Lv {currentParams[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={currentParams[key]}
                    onChange={e => handleParamChange(key, Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>{lowLabel}</span>
                    <span>{highLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                リセット
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>

        {/* 中央列: キャラクタープレビュー */}
        <div className="w-1/3 flex flex-col items-center bg-white">

          {/* スロット選択（上端固定） */}
          <div className="flex items-center gap-2 pt-5 pb-3 shrink-0">
            {Array.from({ length: MAX_SLOTS }, (_, i) => i + 1).map(slot => {
              const isUnlocked = slot <= unlockedSlots;
              const isActive   = slot === activeSlot;
              const cost       = SLOT_UNLOCK_COSTS[slot];
              const isNext     = slot === unlockedSlots + 1;

              if (isUnlocked) {
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotChange(slot)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${
                      isActive
                        ? SLOT_COLORS[slot] + ' text-gray-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {SLOT_LABELS[slot]}
                  </button>
                );
              }

              if (isNext) {
                return (
                  <button
                    key={slot}
                    onClick={() => handleUnlock(slot)}
                    disabled={unlocking || (slot1Points !== null && slot1Points < cost)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title={`${cost}pt で解放`}
                  >
                    <span>🔒</span>
                    <span>{cost}pt</span>
                  </button>
                );
              }

              return (
                <div key={slot} className="px-3 py-1 rounded-full text-xs border-2 border-dashed border-gray-200 text-gray-300">
                  🔒
                </div>
              );
            })}
          </div>

          {/* キャラ＋ポイント（残りスペースで中央揃え） */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 w-full">
          <div className="w-full max-w-xs">
            <Mascot mood="idle" dialogue={dialogue} visible={visible} />
          </div>

          <div className={`w-48 bg-gray-50 rounded-2xl p-4 flex flex-col gap-2 ${loading ? 'invisible' : ''}`}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">所持ポイント</span>
              <span className="font-mono font-bold text-gray-800">{mascotData.current_points} pt</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">累計獲得</span>
              <span className="font-mono text-gray-500">{mascotData.total_earned_points} pt</span>
            </div>
          </div>
          </div>
        </div>

        {/* 右列: ショップ */}
        <div className="w-1/3 flex flex-col items-center justify-center border-l border-gray-200 bg-white">
          <p className="text-2xl mb-2">🛍️</p>
          <p className="text-sm font-bold text-gray-400">Coming Soon</p>
          <p className="text-xs text-gray-300 mt-1">ショップは準備中です</p>
        </div>

      </div>
    </div>
  );
}
