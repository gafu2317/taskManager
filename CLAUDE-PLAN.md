# CLAUDE-PLAN.md - 実装計画

## プロジェクト全体ロードマップ

### Phase 1: 基盤技術理解 ✅ (完了)
- [x] Docker/Docker Compose - DynamoDBローカル環境
- [x] Go/Gin - 基本的なAPIサーバー
- [x] Next.js - フロントエンド開発環境
- [x] GitHub Actions - CI/CDパイプライン
- [x] AWS SDK - DynamoDBローカル接続

### Phase 2: 基本CRUD API実装 (次のステップ)
- [ ] **Task構造体の定義**
  - id, title, description, completed, createdAt, updatedAt
  - JSONタグの設定
- [ ] **DynamoDB操作関数**
  - CreateTask() - タスク作成
  - GetTasks() - 全タスク取得
  - GetTaskByID() - 単一タスク取得
  - UpdateTask() - タスク更新
  - DeleteTask() - タスク削除
- [ ] **APIエンドポイント実装**
  - POST /tasks - 新規作成
  - GET /tasks - 一覧取得
  - GET /tasks/:id - 詳細取得
  - PUT /tasks/:id - 更新
  - DELETE /tasks/:id - 削除
- [ ] **各エンドポイントのテスト作成**

### Phase 3: フロントエンド基本UI (2週間後)
- [ ] **コンポーネント設計**
  - TaskList - タスク一覧表示
  - TaskItem - 個別タスク表示
  - TaskForm - タスク作成・編集フォーム
  - Header - ページヘッダー
- [ ] **状態管理**
  - useState/useEffect の活用
  - API通信の実装
- [ ] **基本的なスタイリング**
  - TailwindCSS活用
  - レスポンシブ対応

### Phase 4: 高度な機能 (1ヶ月後)
- [ ] **認証機能**
  - JWT認証
  - ユーザー登録・ログイン
- [ ] **高度なタスク機能**
  - 優先度設定
  - カテゴリ分類
  - 期限設定・通知
  - 検索・フィルター
- [ ] **UI/UX改善**
  - ドラッグ&ドロップ
  - アニメーション
  - ダークモード

### Phase 5: 本番環境デプロイ (2ヶ月後)
- [ ] **AWS設定**
  - Lambda関数デプロイ
  - API Gateway設定
  - DynamoDB本番テーブル作成
- [ ] **Vercel設定**
  - 環境変数設定
  - 自動デプロイ設定
- [ ] **監視・ログ**
  - CloudWatch設定
  - エラー通知

## 直近の実装予定 (今週)

### 今日・明日
1. **Task構造体定義** (30分)
   ```go
   type Task struct {
       ID          string    `json:"id" dynamodbav:"id"`
       Title       string    `json:"title" dynamodbav:"title"`
       Description string    `json:"description" dynamodbav:"description"`
       Completed   bool      `json:"completed" dynamodbav:"completed"`
       CreatedAt   time.Time `json:"created_at" dynamodbav:"created_at"`
   }
   ```

2. **POST /tasks エンドポイント** (2時間)
   - リクエストボディのバリデーション
   - DynamoDBへの保存
   - レスポンス返却
   - テスト作成

### 今週末
3. **GET /tasks エンドポイント** (1時間)
   - DynamoDBからの全件取得
   - JSON形式での返却

4. **フロントエンド基本画面** (3時間)
   - タスク一覧表示
   - タスク作成フォーム
   - APIとの連携

## 学習目標

### 短期目標 (1週間)
- CRUD API完成
- 基本的なフロントエンド画面
- ローカル環境での動作確認

### 中期目標 (1ヶ月)
- 本格的なWebアプリケーション完成
- ユーザビリティの高いUI
- 自動テストの充実

### 長期目標 (3ヶ月)
- 本番環境での運用
- パフォーマンス最適化
- 追加機能の実装

## 技術選択の方針

### 優先順位
1. **学習効果** - 新しい技術を体験できるか
2. **実用性** - 実際の開発現場で使えるか
3. **保守性** - コードが理解しやすく拡張しやすいか

### 実装方針
- 最小機能から始めて徐々に拡張
- 各機能でしっかりテストを書く
- ドキュメント（このファイル）を継続更新

---

**更新ルール**:
- 機能完成時にチェックマークを付ける
- 計画変更時は理由と共に記録
- 新しいアイデアは「追加機能案」セクションに記録
- 週次で進捗レビューを実施