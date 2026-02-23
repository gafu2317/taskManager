'use client';

import { useState, useEffect } from 'react';
import Mascot from './Mascot';
import { useMascotDialogue, useMascotData } from '@/hooks/useMascot';
import { getMascot, unlockMascotSlot } from '@/lib/api';
import {
  PERSONALITY_PRESETS,
  MAX_SLOTS,
  SLOT_UNLOCK_COSTS,
} from '@/types/mascot';

const SLOT_COLORS = ['', 'bg-blue-100 border-blue-400', 'bg-pink-100 border-pink-400', 'bg-green-100 border-green-400'];
const SLOT_LABELS = ['', 'キャラ 1', 'キャラ 2', 'キャラ 3'];

export default function MascotView() {
  const [activeSlot, setActiveSlot] = useState(1);
  const [unlockedSlots, setUnlockedSlots] = useState(1);
  const [unlocking, setUnlocking] = useState(false);

  const { mascotData, loading, updatePreset } = useMascotData(activeSlot);
  const { dialogue, visible } = useMascotDialogue('idle', mascotData.personality_preset);

  const [selecting, setSelecting] = useState<string | null>(null);

  // スロット1から解放済みスロット数を取得
  useEffect(() => {
    getMascot(1)
      .then(d => setUnlockedSlots(d.unlocked_slots || 1))
      .catch(() => {});
  }, []);

  const handleSelectPreset = async (presetId: string) => {
    setSelecting(presetId);
    try {
      await updatePreset(presetId);
    } catch (e) {
      alert(e instanceof Error ? e.message : '変更に失敗しました');
    } finally {
      setSelecting(null);
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

  // スロット切り替え時
  const handleSlotChange = (slot: number) => {
    setActiveSlot(slot);
  };

  // スロット1のポイント（解放コスト判定用）
  const slot1Points = activeSlot === 1 ? mascotData.current_points : null;

  const currentPreset = mascotData.personality_preset || 'flat';
  const unlockedPresets: string[] = mascotData.unlocked_presets ?? ['flat'];

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">

      {/* メインコンテンツ（3カラム） */}
      <div className="flex flex-1 overflow-hidden">

        {/* 左列: 性格プリセット選択 */}
        <div className="w-1/3 flex flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="p-6">
            <h2 className="text-base font-bold text-gray-700 mb-1">性格プリセット</h2>
            <p className="text-xs text-gray-400 mb-4">解放済みのプリセットはいつでも無料で切り替えられます</p>

            <div className="flex flex-col gap-2">
              {PERSONALITY_PRESETS.map((preset) => {
                const isUnlocked = unlockedPresets.includes(preset.id);
                const isActive   = currentPreset === preset.id;
                const canAfford  = mascotData.current_points >= preset.cost;
                const isBusy     = selecting === preset.id;

                return (
                  <div
                    key={preset.id}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      isActive
                        ? 'border-blue-400 bg-blue-50'
                        : isUnlocked
                        ? 'border-gray-200 bg-white hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${isActive ? 'text-blue-700' : isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                            {preset.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                              選択中
                            </span>
                          )}
                          {isUnlocked && !isActive && (
                            <span className="text-[10px] text-green-600 font-medium">解放済み</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {!isUnlocked && (
                          <span className={`text-xs font-mono font-bold ${canAfford ? 'text-orange-500' : 'text-gray-400'}`}>
                            {preset.cost}pt
                          </span>
                        )}
                        {isActive ? null : isUnlocked ? (
                          <button
                            onClick={() => handleSelectPreset(preset.id)}
                            disabled={isBusy || selecting !== null}
                            className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-600 font-medium hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {isBusy ? '...' : '選択'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectPreset(preset.id)}
                            disabled={!canAfford || isBusy || selecting !== null || loading}
                            className="text-xs px-2 py-1 rounded-lg bg-orange-100 text-orange-600 font-medium hover:bg-orange-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title={canAfford ? `${preset.cost}ptで解放` : 'ポイント不足'}
                          >
                            {isBusy ? '...' : '解放'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
