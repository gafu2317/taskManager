export type MascotMood = 'idle' | 'happy' | 'cheering' | 'working';

export type PersonalityPresetId =
  | 'flat' | 'genki' | 'amaenbou' | 'tennen'
  | 'tsundere' | 'majime' | 'nekketsu' | 'cool';

export type PersonalityPreset = {
  id: PersonalityPresetId;
  name: string;
  description: string;
  cost: number;
};

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  { id: 'flat',      name: 'フラット',       description: '性格なし。デフォルト状態。',          cost: 0   },
  { id: 'genki',     name: '元気な子',       description: 'いつも元気いっぱい！',                cost: 100 },
  { id: 'amaenbou',  name: '甘えん坊',       description: 'あなたのそばにいたい…',               cost: 150 },
  { id: 'tennen',    name: '天然ボケ',       description: '独特の視点で話しかけてくる。',        cost: 150 },
  { id: 'tsundere',  name: 'ツンデレ',       description: 'べ、別に応援してるわけじゃないし！',  cost: 200 },
  { id: 'majime',    name: '真面目な優等生', description: 'データと実績で励ます。',              cost: 200 },
  { id: 'nekketsu',  name: '熱血コーチ',     description: '全力で背中を押す！',                  cost: 300 },
  { id: 'cool',      name: 'クールな先輩',   description: '静かだけど、ちゃんと見てる。',        cost: 300 },
];

export type MascotData = {
  user_id: string;
  current_points: number;
  total_earned_points: number;
  personality_preset: string;
  unlocked_presets: string[];
  owned_accessories: string[];
  equipped_accessories: string[];
  last_login_date: string;  // YYYY-MM-DD
  unlocked_slots: number;   // 解放済みスロット数（スロット1のみ有効）
  created_at: string;
  updated_at: string;
};

export const MAX_SLOTS = 3;

// スロット解放コスト（スロット番号 → pt）
export const SLOT_UNLOCK_COSTS: Record<number, number> = {
  2: 500,
  3: 1000,
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
