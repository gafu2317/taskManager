'use client';

import { useState } from 'react';
import {
  PersonalityParams,
  PERSONALITY_PARAMS,
  calcPersonalityCost,
  DEFAULT_PERSONALITY_PARAMS,
} from '@/types/mascot';

interface PersonalityEditorProps {
  currentParams: PersonalityParams;
  currentPoints: number;
  onSave: (params: PersonalityParams) => Promise<void>;
  onClose: () => void;
}

export default function PersonalityEditor({
  currentParams,
  currentPoints,
  onSave,
  onClose,
}: PersonalityEditorProps) {
  const [params, setParams] = useState<PersonalityParams>(currentParams);
  const [saving, setSaving] = useState(false);

  const oldCost = calcPersonalityCost(currentParams);
  const newCost = calcPersonalityCost(params);
  const diff = newCost - oldCost;                // 追加投資額（マイナスなら返還）
  const availablePoints = currentPoints - diff;   // 保存後の残高
  const canSave = availablePoints >= 0;

  const handleChange = (key: keyof PersonalityParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setParams(DEFAULT_PERSONALITY_PARAMS);
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(params);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">性格設定</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* ポイント表示 */}
        <div className="bg-gray-50 rounded-xl p-3 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">所持ポイント</span>
            <span className="font-mono font-bold">{currentPoints} pt</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">使用中</span>
            <span className={`font-mono font-bold ${newCost > currentPoints + oldCost ? 'text-red-500' : 'text-blue-500'}`}>
              {newCost} pt
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-500">保存後の残高</span>
            <span className={`font-mono font-bold ${availablePoints < 0 ? 'text-red-500' : 'text-gray-800'}`}>
              {availablePoints} pt
            </span>
          </div>
        </div>

        {/* パラメータスライダー */}
        <div className="flex flex-col gap-5">
          {PERSONALITY_PARAMS.map(({ key, name, lowLabel, highLabel }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{name}</span>
                <span className="text-sm font-mono text-gray-500">Lv {params[key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={params[key]}
                onChange={e => handleChange(key, Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>{lowLabel}</span>
                <span>{highLabel}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ボタン */}
        <div className="flex gap-3 mt-6">
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
  );
}
