# T10: フロントエンド - タスク完了・セッション終了との連携

**依存**: T06（APIクライアント）
**次のタスク**: なし（最終タスク）

---

## 目的

実際のユーザーアクション（タスク完了・作業セッション終了）時に
マスコットのポイント付与APIを呼び出す。

## 変更するファイル

1. **変更**: `frontend/src/components/features/worktime/WorkTimeView.tsx`（セッション終了時）
2. **変更**: タスク完了処理を行っているコンポーネント（下記を確認して特定）

---

## 1. セッション終了時のポイント付与（WorkTimeView.tsx）

`handleEnd` 関数内で `createSession` を呼んだ後に `postMascotAction` を呼ぶ。

### 変更箇所

**変更前** (`handleEnd` の末尾部分):

```tsx
const newSession = await createSession({
  taskId: selectedTaskId,
  taskTitle: selectedTask.title,
  date,
  workTime: finalWork,
  breakTime: finalBreak,
  startedAt: sessionStartTime.toISOString(),
  endedAt: endTime.toISOString(),
});
// ...ここまで
```

**変更後**:

```tsx
import { postMascotAction } from '@/lib/api';

// handleEnd 内、createSession の直後に追加
const newSession = await createSession({ ... });

// ポイント付与（失敗しても作業記録には影響させない）
postMascotAction('work_session', finalWork).catch(() => {});
```

`finalWork` は秒単位。バックエンドで `floor(finalWork / 1800) * 10` pt として計算される。
30分未満のセッションは 0pt になる（正常動作）。

---

## 2. タスク完了時のポイント付与

タスク完了ボタンを処理しているコンポーネントを特定してから変更する。

### 確認すべきファイル

```
frontend/src/components/features/tasks/
```

このディレクトリの中でタスクの `completed: true` への更新を行っているコードを探す。

```bash
# 確認コマンド
grep -r "completed" frontend/src/components/features/tasks/ --include="*.tsx" -l
grep -r "updateTask" frontend/src/components/features/tasks/ --include="*.tsx" -n
```

### 変更パターン

タスク完了の `updateTask` 呼び出しの直後に追加する:

```tsx
import { postMascotAction } from '@/lib/api';

// updateTask の直後に追加
await updateTask(taskId, { completed: true });
postMascotAction('task_complete').catch(() => {});  // 失敗してもUIに影響させない
```

---

## 注意点

- **fire-and-forget**: ポイント付与の失敗はユーザーに見せない
  - `catch(() => {})` で握り潰す
  - タスク完了・セッション記録の主動作には影響させない
- **重複付与防止はバックエンドで不要**
  - タスク完了は毎回 +10pt（何度完了してもよい）
  - セッションも終了するたびに付与（バックエンドで検証不要）
  - ログインボーナスのみバックエンドで日付チェックしている

---

## 完了条件

- タスクを完了すると `POST /mascot/action { type: "task_complete" }` が呼ばれる
- 作業セッションを終了すると `POST /mascot/action { type: "work_session", work_seconds: N }` が呼ばれる
- どちらの処理も失敗しても元の機能（タスク更新・セッション記録）に影響しない
