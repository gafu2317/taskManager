# T06: フロントエンド - APIクライアント追加

**依存**: T04（バックエンドデプロイ済み）、T05（型定義）
**次のタスク**: T07, T10

---

## 目的

マスコット関連のバックエンド API を叩く関数を追加する。

## 変更するファイル

1. **変更**: `frontend/src/lib/api.dynamodb.ts`
2. **変更**: `frontend/src/lib/api.ts`

---

## 1. `api.dynamodb.ts` への追加

### 既存の規約

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function getAuthHeaders(): Promise<HeadersInit> {
  // X-User-ID ヘッダーを付与する（未認証なら throw）
}

export async function getTasks(...) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: await getAuthHeaders(),
  });
  // ...
}
```

### 追加するインポート

```ts
import { MascotData, PersonalityParams } from '../types/mascot';
```

### 追加する関数

```ts
// マスコットデータ取得
export async function getMascot(): Promise<MascotData> {
  const response = await fetch(`${API_BASE_URL}/mascot`, {
    headers: await getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch mascot');
  return response.json();
}

// ポイント付与アクション
export async function postMascotAction(
  type: 'task_complete' | 'work_session' | 'login',
  workSeconds?: number
): Promise<{ earned_points: number; current_points: number }> {
  const response = await fetch(`${API_BASE_URL}/mascot/action`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ type, work_seconds: workSeconds ?? 0 }),
  });
  if (!response.ok) throw new Error('Failed to post mascot action');
  return response.json();
}

// 性格パラメータ変更
export async function postMascotPersonality(params: PersonalityParams): Promise<MascotData> {
  const response = await fetch(`${API_BASE_URL}/mascot/personality`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ params }),
  });
  if (!response.ok) throw new Error('Failed to update personality');
  return response.json();
}

// アクセサリー購入
export async function postMascotShopBuy(accessoryId: string): Promise<MascotData> {
  const response = await fetch(`${API_BASE_URL}/mascot/shop/buy`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ accessory_id: accessoryId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Failed to buy accessory');
  }
  return response.json();
}

// アクセサリー装備変更
export async function putMascotEquip(equipped: string[]): Promise<MascotData> {
  const response = await fetch(`${API_BASE_URL}/mascot/equip`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ equipped }),
  });
  if (!response.ok) throw new Error('Failed to update equip');
  return response.json();
}
```

---

## 2. `api.ts` への追加

`api.ts` はログイン状態でAPIを切り替えるラッパー。
マスコットはサーバー保存のみ（未ログイン時は何もしない）。

### 追加するインポート

```ts
import { MascotData, PersonalityParams } from '../types/mascot';
```

### 追加する関数

```ts
// マスコット（サーバーのみ・未ログイン時はデフォルト値を返す）
const DEFAULT_MASCOT: MascotData = {
  user_id: '',
  current_points: 0,
  total_earned_points: 0,
  personality_params: { genki: 0, kibishisa: 0, amae: 0, tsundere: 0, majime: 0, tennen: 0 },
  owned_accessories: [],
  equipped_accessories: [],
  last_login_date: '',
  created_at: '',
  updated_at: '',
};

export async function getMascot(): Promise<MascotData> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return DEFAULT_MASCOT;
  return dynamoApi.getMascot();
}

export async function postMascotAction(
  type: 'task_complete' | 'work_session' | 'login',
  workSeconds?: number
): Promise<void> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return;
  await dynamoApi.postMascotAction(type, workSeconds);
}

export async function postMascotPersonality(params: PersonalityParams): Promise<MascotData> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return DEFAULT_MASCOT;
  return dynamoApi.postMascotPersonality(params);
}

export async function postMascotShopBuy(accessoryId: string): Promise<MascotData> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return DEFAULT_MASCOT;
  return dynamoApi.postMascotShopBuy(accessoryId);
}

export async function putMascotEquip(equipped: string[]): Promise<MascotData> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return DEFAULT_MASCOT;
  return dynamoApi.putMascotEquip(equipped);
}
```

## 完了条件

- 両ファイルに関数が追加されている
- TypeScript のコンパイルエラーがない
