# T07: フロントエンド - useMascotフック拡張

**依存**: T06（APIクライアント）
**次のタスク**: T08, T09

---

## 目的

`useMascot` フックを拡張して、サーバーからのマスコットデータ取得・操作を担う。
現在のセリフ制御ロジックは残しつつ、`MascotData` を状態として管理する。

## 変更するファイル

**変更**: `frontend/src/hooks/useMascot.ts`

---

## 現在の実装（変更前）

```ts
// セリフ・表示制御のみ
export function useMascot(mood: MascotMood) {
  const [dialogue, setDialogue] = useState<string>('');
  const [visible, setVisible] = useState(false);
  // ...
  return { dialogue, visible };
}
```

---

## 新しい設計

`useMascot` を2つに分割する：

1. **`useMascotDialogue(mood, params)`** - セリフ制御（既存ロジックを改名・拡張）
2. **`useMascotData()`** - サーバーデータの取得・操作

`WorkTimeView.tsx` は現在 `useMascot(mood)` を呼んでいるため、
`useMascotDialogue` に改名して同じシグネチャで提供する。

---

## 実装内容

```ts
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MascotMood, MascotData, PersonalityParams, DEFAULT_PERSONALITY_PARAMS } from '../types/mascot';
import { getDialogue } from '../lib/mascotDialogue';
import {
  getMascot,
  postMascotAction,
  postMascotPersonality,
  postMascotShopBuy,
  putMascotEquip,
} from '../lib/api';

// ─── セリフ制御フック（既存の useMascot を改名） ───────────────────────

export function useMascotDialogue(mood: MascotMood, params?: PersonalityParams) {
  const [dialogue, setDialogue] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const prevMoodRef = useRef(mood);

  useEffect(() => {
    setDialogue(getDialogue(mood));  // params は将来のセリフシステム拡張で使う
    setVisible(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      fadeAndChange(mood);
    }
  }, [mood]);

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
  personality_params: DEFAULT_PERSONALITY_PARAMS,
  owned_accessories: [],
  equipped_accessories: [],
  last_login_date: '',
  created_at: '',
  updated_at: '',
};

export function useMascotData() {
  const [mascotData, setMascotData] = useState<MascotData>(DEFAULT_MASCOT_DATA);
  const [loading, setLoading] = useState(true);

  // 初回ロード + ログインボーナス付与
  useEffect(() => {
    getMascot()
      .then((data) => {
        setMascotData(data);
        // ログインボーナス（今日まだ付与していなければ）
        return postMascotAction('login');
      })
      .then(() => getMascot())  // ログインボーナス付与後に再取得
      .then(setMascotData)
      .catch(() => {})  // 未ログイン時はエラーを無視
      .finally(() => setLoading(false));
  }, []);

  // 性格パラメータ変更
  const updatePersonality = useCallback(async (params: PersonalityParams) => {
    const updated = await postMascotPersonality(params);
    setMascotData(updated);
  }, []);

  // アクセサリー購入
  const buyAccessory = useCallback(async (accessoryId: string) => {
    const updated = await postMascotShopBuy(accessoryId);
    setMascotData(updated);
  }, []);

  // アクセサリー装備変更
  const updateEquip = useCallback(async (equipped: string[]) => {
    const updated = await putMascotEquip(equipped);
    setMascotData(updated);
  }, []);

  // ポイント付与（外部から呼ぶ用）
  const addPoints = useCallback(async (
    type: 'task_complete' | 'work_session',
    workSeconds?: number
  ) => {
    await postMascotAction(type, workSeconds);
    const updated = await getMascot();
    setMascotData(updated);
  }, []);

  return {
    mascotData,
    loading,
    updatePersonality,
    buyAccessory,
    updateEquip,
    addPoints,
  };
}
```

---

## `WorkTimeView.tsx` の変更

`useMascot` を `useMascotDialogue` に変更する必要はないが、
`useMascotData` を使ってポイント付与の連携ができるようになる（T10で対応）。

現状の `WorkTimeView.tsx` の `useMascot(worktimeMood)` の呼び出しは
後方互換でそのまま動く。

## 完了条件

- `frontend/src/hooks/useMascot.ts` が更新されている
- 既存の `WorkTimeView.tsx` が壊れていない（`useMascot` の後方互換が保たれている）
- TypeScript のコンパイルエラーがない
