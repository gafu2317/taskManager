# T05: フロントエンド - 型定義更新

**依存**: なし（バックエンドと並行可能）
**次のタスク**: T06

---

## 目的

フロントエンドのマスコット関連の TypeScript 型定義を拡張する。

## 変更するファイル

**変更**: `frontend/src/types/mascot.ts`

## 現在の内容

```ts
export type MascotMood = 'idle' | 'happy' | 'cheering' | 'working';
```

## 追加する型

バックエンドの `models/mascot.go` と対応する型を追加する。

```ts
export type MascotMood = 'idle' | 'happy' | 'cheering' | 'working';

export type PersonalityParams = {
  genki: number;       // 元気 (0〜10)
  kibishisa: number;   // 厳しさ (0〜10)
  amae: number;        // 甘え (0〜10)
  tsundere: number;    // ツンデレ (0〜10)
  majime: number;      // 真面目 (0〜10)
  tennen: number;      // 天然 (0〜10)
};

export type MascotData = {
  user_id: string;
  current_points: number;
  total_earned_points: number;
  personality_params: PersonalityParams;
  owned_accessories: string[];
  equipped_accessories: string[];
  last_login_date: string;  // YYYY-MM-DD
  created_at: string;
  updated_at: string;
};

// アクセサリーID一覧（バックエンドの accessoryPrices と一致させる）
export type AccessoryId = 'ribbon' | 'hat' | 'glasses' | 'scarf' | 'crown';

export type AccessoryInfo = {
  id: AccessoryId;
  name: string;   // 日本語名
  price: number;  // pt
};

// アクセサリーマスタ（フロントエンド側に持つ）
export const ACCESSORIES: AccessoryInfo[] = [
  { id: 'ribbon',  name: 'リボン',   price: 30  },
  { id: 'hat',     name: '帽子',     price: 50  },
  { id: 'glasses', name: 'メガネ',   price: 80  },
  { id: 'scarf',   name: 'マフラー', price: 40  },
  { id: 'crown',   name: '王冠',     price: 200 },
];

// 性格パラメータのメタ情報
export type PersonalityParamKey = keyof PersonalityParams;

export type PersonalityParamInfo = {
  key: PersonalityParamKey;
  name: string;   // 日本語名
  lowLabel: string;   // 低い時の説明
  highLabel: string;  // 高い時の説明
};

export const PERSONALITY_PARAMS: PersonalityParamInfo[] = [
  { key: 'genki',      name: '元気',   lowLabel: '穏やか',   highLabel: 'テンション高め' },
  { key: 'kibishisa',  name: '厳しさ', lowLabel: 'やさしい', highLabel: '叱咤激励' },
  { key: 'amae',       name: '甘え',   lowLabel: 'クール',   highLabel: '懐いてくる' },
  { key: 'tsundere',   name: 'ツンデレ', lowLabel: '素直',   highLabel: '素直じゃない' },
  { key: 'majime',     name: '真面目', lowLabel: '気まぐれ', highLabel: '実績・数値を引用' },
  { key: 'tennen',     name: '天然',   lowLabel: '普通',     highLabel: '独自視点' },
];

// 性格パラメータのデフォルト値
export const DEFAULT_PERSONALITY_PARAMS: PersonalityParams = {
  genki: 0, kibishisa: 0, amae: 0, tsundere: 0, majime: 0, tennen: 0,
};

// 性格パラメータの投資コスト計算（1Lv = 10pt）
export function calcPersonalityCost(params: PersonalityParams): number {
  return Object.values(params).reduce((sum, v) => sum + v, 0) * 10;
}
```

## 完了条件

- `frontend/src/types/mascot.ts` が上記の内容で更新されている
- TypeScript のコンパイルエラーがない（`npx tsc --noEmit` で確認）
