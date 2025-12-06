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

## 現在の完成系イメージ（物理バルーンシステム）

### **最終的な動作イメージ**
- **枠**: 四角い境界線のある箱型コンテナ（サイズ可変対応）
- **バルーン**: 複数のカラフルな円形バルーンが物理的に跳ね回る
- **サイズ**: 重要度に比例（importance 1-5 → 直径42-90px）
- **色分け**: コスト別の5段階カラー
  - コスト1: 青（#3B82F6）
  - コスト2: 緑（#10B981）
  - コスト3: 黄色（#F59E0B）
  - コスト4: オレンジ（#F97316）
  - コスト5: 赤（#EF4444）

### **物理挙動**
- **初期動作**: 各バルーンがランダムな方向・速度で移動開始
- **壁反射**: 枠の境界に当たると跳ね返る
- **バルーン間衝突**: 他のバルーンとぶつかると跳ね返る
- **当たり判定**: バルーンの外側（境界円）で判定（中心点ではない）

### **技術構成**
- **物理演算**: CSS transform + requestAnimationFrame
- **コンポーネント構造**: 
  - TaskBubbleView（枠・全体管理）
  - PhysicsBubble（物理演算・1バルーン）
  - TaskBubble（見た目のみ・1バルーン）
- **リアルタイム**: 60FPSでの滑らか衝突判定

### **ユーザー体験**
- タスクの重要度・コストが視覚的に一目で分かる
- 動的で楽しいインターフェース
- ホバーで拡大表示
- クリックで詳細情報表示

---

**更新ルール**:
- 機能完成時にチェックマークを付ける
- 計画変更時は理由と共に記録
- 新しいアイデアは「追加機能案」セクションに記録
- 完成系イメージを常に最新状態に保つ
- 週次で進捗レビューを実施