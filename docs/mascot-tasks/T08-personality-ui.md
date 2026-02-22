# T08: フロントエンド - 性格パラメータ配分UI

**依存**: T07（useMascotDataフック）
**次のタスク**: T09

---

## 目的

マスコットの性格パラメータを配分するUIコンポーネントを作成する。
マスコットパネル（サイドバー）から開くモーダルとして実装する。

## 作成するファイル

**新規作成**: `frontend/src/components/features/mascot/PersonalityEditor.tsx`

---

## UI仕様

```
┌────────────────────────────────┐
│  性格設定                   ✕  │
│                                │
│  所持ポイント: 150 pt           │
│  使用中: 60 pt / 残り: 90 pt   │
│                                │
│  元気          ━━━━━○━━━ 3     │
│  穏やか ←───────────→ テンション高め │
│                                │
│  厳しさ        ━━○━━━━━━ 2     │
│  やさしい ←───────────→ 叱咤激励   │
│                                │
│  ... (全6軸)                   │
│                                │
│      [リセット]  [保存]         │
└────────────────────────────────┘
```

- 各パラメータ: 0〜10 のスライダー
- 現在の使用ポイント合計をリアルタイム表示
- 使用ポイントが所持ポイントを超えたら保存ボタンを無効化
- 「リセット」: 全パラメータを0にして所持ポイントを全額返還
- 「保存」: `updatePersonality(params)` を呼ぶ

---

## 実装内容

```tsx
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
```

---

## マスコットパネルへの組み込み

マスコットが表示されている場所（`WorkTimeView.tsx` の右列）に「性格設定」ボタンを追加し、
`PersonalityEditor` をモーダルとして開く。

```tsx
// WorkTimeView.tsx 内（右列・マスコット表示の下あたり）
import PersonalityEditor from '@/components/features/mascot/PersonalityEditor';
import { useMascotData } from '@/hooks/useMascot';

// コンポーネント内
const { mascotData, updatePersonality } = useMascotData();
const [showPersonality, setShowPersonality] = useState(false);

// JSX
<button onClick={() => setShowPersonality(true)} className="...">
  性格設定
</button>

{showPersonality && (
  <PersonalityEditor
    currentParams={mascotData.personality_params}
    currentPoints={mascotData.current_points}
    onSave={updatePersonality}
    onClose={() => setShowPersonality(false)}
  />
)}
```

## 完了条件

- `PersonalityEditor.tsx` が作成されている
- スライダーで 0〜10 を設定できる
- ポイント残高がリアルタイムで更新される
- ポイント不足時に保存ボタンが無効になる
- 保存後にモーダルが閉じる
- TypeScript のコンパイルエラーがない
