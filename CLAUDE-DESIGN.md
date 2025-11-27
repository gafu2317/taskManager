# CLAUDE-DESIGN.md - システム設計

## API設計

### エンドポイント一覧
```
GET    /health                 # ヘルスチェック ✅
POST   /tasks                  # タスク作成 ✅
GET    /tasks                  # タスク一覧取得 ✅
GET    /tasks/:id              # タスク詳細取得 ✅
PUT    /tasks/:id              # タスク更新 ✅
DELETE /tasks/:id              # タスク削除 ✅

# 認証API
POST   /auth/register          # ユーザー登録 ✅
POST   /auth/login             # ログイン ✅
POST   /auth/refresh           # トークン更新 ✅
POST   /auth/guest             # ゲストユーザー作成 ✅
POST   /auth/guest-login       # ゲストトークンログイン ✅
POST   /auth/upgrade           # ゲスト→登録ユーザー変換 ✅
```

### POST /tasks 詳細設計

#### リクエスト形式
```json
POST /tasks
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
    "title": "Go言語のAPI開発を学ぶ",
    "description": "Next.jsとの連携方法を習得する",
    "importance": 4,
    "cost": 3,
    "tags": ["プログラミング", "学習"]
}
```

#### バリデーション
```go
type CreateTaskRequest struct {
    Title       string   `json:"title" validate:"required,max=100"`
    Description string   `json:"description" validate:"max=500"`
    Importance  int      `json:"importance" validate:"required,min=1,max=5"`
    Cost        int      `json:"cost" validate:"required,min=1,max=5"`
    Tags        []string `json:"tags" validate:"max=10,dive,max=30"`
}
```

#### 成功レスポンス (201 Created)
```json
{
    "success": true,
    "data": {
        "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "user_id": "user_12345",
        "title": "Go言語のAPI開発を学ぶ",
        "description": "Next.jsとの連携方法を習得する",
        "completed": false,
        "importance": 4,
        "cost": 3,
        "tags": ["プログラミング", "学習"],
        "created_at": "2025-11-27T15:55:00Z",
        "updated_at": "2025-11-27T15:55:00Z"
    }
}
```

#### エラーレスポンス (400 Bad Request)
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "入力値が不正です",
        "details": [
            {
                "field": "title",
                "message": "タイトルは必須です"
            },
            {
                "field": "importance",
                "message": "重要度は1-5の範囲で入力してください"
            }
        ]
    }
}
```

#### 処理フロー
```
1. JWTトークン検証・user_id抽出
2. リクエスト受信・JSON解析
3. バリデーション実行
4. ULID生成
5. user_id・タイムスタンプ設定
6. DynamoDB保存
7. レスポンス返却
```

#### 認証エラーレスポンス (401 Unauthorized)
```json
{
    "success": false,
    "error": {
        "code": "UNAUTHORIZED",
        "message": "認証が必要です"
    }
}
```

### POST /auth/register 設計

#### リクエスト形式
```json
POST /auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "password_confirm": "SecurePassword123!",
    "name": "田中太郎"
}
```

#### バリデーション
```go
type RegisterRequest struct {
    Email           string `json:"email" validate:"required,email,max=255"`
    Password        string `json:"password" validate:"required,min=8,max=100"`
    PasswordConfirm string `json:"password_confirm" validate:"required,eqfield=Password"`
    Name            string `json:"name" validate:"required,min=1,max=50"`
}
```

#### 成功レスポンス (201 Created)
```json
{
    "success": true,
    "data": {
        "user_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "email": "user@example.com",
        "name": "田中太郎",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "def50200abc123...",
        "expires_in": 3600
    }
}
```

#### エラーレスポンス (409 Conflict)
```json
{
    "success": false,
    "error": {
        "code": "EMAIL_ALREADY_EXISTS",
        "message": "このメールアドレスは既に登録されています"
    }
}
```

### POST /auth/login 設計

#### リクエスト形式
```json
POST /auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecurePassword123!"
}
```

#### バリデーション
```go
type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
}
```

#### 成功レスポンス (200 OK)
```json
{
    "success": true,
    "data": {
        "user_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "email": "user@example.com",
        "name": "田中太郎",
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "def50200abc123...",
        "expires_in": 3600
    }
}
```

#### エラーレスポンス (401 Unauthorized)
```json
{
    "success": false,
    "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "メールアドレスまたはパスワードが間違っています"
    }
}
```

### POST /auth/refresh 設計

#### リクエスト形式
```json
POST /auth/refresh
Content-Type: application/json

{
    "refresh_token": "def50200abc123..."
}
```

#### 成功レスポンス (200 OK)
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "ghi78900def456...",
        "expires_in": 3600
    }
}
```

#### 処理フロー
```
【登録】
1. バリデーション実行
2. メール重複チェック  
3. パスワードハッシュ化
4. ユーザーID(ULID)生成
5. Usersテーブルに保存
6. JWT生成・返却

【ログイン】
1. メール・パスワードバリデーション
2. ユーザー存在チェック
3. パスワード照合
4. JWT生成・返却

【トークン更新】
1. refresh_token検証
2. 新しいアクセストークン生成
3. 新しいrefresh_token生成
```

### JWT自動延長認証システム 設計確定

#### 基本設定
```go
const (
    InitialTokenDuration = 7 * 24 * time.Hour    // 初期: 1週間
    MaxTokenDuration     = 14 * 24 * time.Hour   // 最大: 2週間
    ExtensionThreshold   = 7 * 24 * time.Hour    // 残り1週間で延長
)
```

#### 延長ロジック
```go
func shouldExtendToken(exp time.Time) bool {
    timeUntilExpiry := exp.Sub(time.Now())
    return timeUntilExpiry < ExtensionThreshold  // 残り1週間以下
}

func calculateNewExpiry(currentExp time.Time) time.Time {
    // 現在時刻から1週間後
    newExp := time.Now().Add(InitialTokenDuration)
    
    // ただし2週間は超えない
    maxAllowed := time.Now().Add(MaxTokenDuration)
    if newExp.After(maxAllowed) {
        return maxAllowed
    }
    return newExp
}
```

#### JWT ペイロード
```json
{
    "user_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "email": "user@example.com",
    "iat": 1701000000,           // 発行日時
    "exp": 1701604800,           // 有効期限（1週間後）
    "last_extended": 1701000000  // 最終延長日時
}
```

#### ミドルウェア処理フロー
```
1. Authorization ヘッダーからトークン取得
2. JWT検証・パース
3. 有効期限チェック
4. user_id抽出
5. 残り期間が1週間以下？
   → YES: 新トークン生成 → レスポンスヘッダーに設定
   → NO: そのまま処理継続
6. API処理実行
```

#### レスポンス例
```
HTTP/1.1 200 OK
Content-Type: application/json
Authorization: Bearer <新しいトークン>
X-Token-Refreshed: true

{
    "success": true,
    "data": { ... }
}
```

### ハイブリッド認証システム 設計確定

#### User構造体（統合設計）
```go
type User struct {
    ID           string    `json:"id" dynamodbav:"id"`               // ULID
    UserType     string    `json:"user_type" dynamodbav:"user_type"` // "registered" or "guest"
    
    // 登録ユーザー用フィールド
    Username     *string   `json:"username" dynamodbav:"username"`       // 登録ユーザーのみ
    PasswordHash *string   `json:"-" dynamodbav:"password_hash"`         // 登録ユーザーのみ
    
    // 共通フィールド
    Name         string    `json:"name" dynamodbav:"name"`           // 表示名
    GuestToken   *string   `json:"-" dynamodbav:"guest_token"`       // ゲストユーザーのみ
    
    CreatedAt    time.Time `json:"created_at" dynamodbav:"created_at"`
    UpdatedAt    time.Time `json:"updated_at" dynamodbav:"updated_at"`
}
```

#### Usersテーブル設計
```
テーブル名: Users
パーティションキー: id (ULID)
属性: user_type, username, password_hash, name, guest_token, created_at, updated_at

GSI: UsernameIndex
パーティションキー: username (String)  // 登録ユーザーのログイン用

GSI: GuestTokenIndex  
パーティションキー: guest_token (String)  // ゲスト継続ログイン用
```

#### 認証エンドポイント
```
POST /auth/guest      # ゲストユーザー作成
POST /auth/register   # 登録ユーザー作成
POST /auth/login      # ユーザー名ログイン
POST /auth/guest-login # ゲストトークンでログイン
POST /auth/upgrade    # ゲスト→登録ユーザー変換
```

## データ設計

### Task構造体
```go
type Task struct {
    ID          string    `json:"id" dynamodbav:"id"`           // ULID形式
    UserID      string    `json:"user_id" dynamodbav:"user_id"` // ユーザー識別子
    Title       string    `json:"title" dynamodbav:"title" validate:"required,max=100"`
    Description string    `json:"description" dynamodbav:"description" validate:"max=500"`
    Completed   bool      `json:"completed" dynamodbav:"completed"`
    
    // 重要度・コスト管理
    Importance  int       `json:"importance" dynamodbav:"importance" validate:"min=1,max=5"`  // 1-5
    Cost        int       `json:"cost" dynamodbav:"cost" validate:"min=1,max=5"`             // 1-5
    
    // タグ機能
    Tags        []string  `json:"tags" dynamodbav:"tags"`              // ユーザー確定タグ
    
    // メタデータ
    CreatedAt   time.Time `json:"created_at" dynamodbav:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" dynamodbav:"updated_at"`
}
```

### DynamoDBテーブル設計

#### Tasksテーブル
```
テーブル名: Tasks
パーティションキー: user_id (String)
ソートキー: id (ULID)
属性: title, description, completed, importance, cost, 
      tags, created_at, updated_at

GSI(Global Secondary Index):
- UserImportanceIndex: 
  - PartitionKey: user_id
  - SortKey: importance (降順)
- UserTagIndex:
  - PartitionKey: user_id 
  - SortKey: tags
```


#### UserTagsテーブル (ユーザーのタグ履歴)
```
テーブル名: UserTags
パーティションキー: user_id (String)
ソートキー: tag_name (String)
属性:
  usage_count (Number)       - 使用回数
  last_used (String)         - 最終使用日時
  created_at (String)        - 作成日時
```

#### TagSuggestionsテーブル (AI提案機能)
```
テーブル名: TagSuggestions  
パーティションキー: pattern_hash (String)
ソートキー: confidence (Number)
属性:
  title_keywords (List)      - タイトルのキーワード
  suggested_tags (List)      - AI推奨タグリスト
  confidence (Number)        - 信頼度 (0.0-1.0)
  usage_count (Number)       - 採用回数
  created_at (String)
  updated_at (String)
```

## UI設計

### コンポーネント構成
```
App
├── Header
├── TaskForm         # タスク作成・編集
│   ├── TagInput     # タグ入力フィールド
│   ├── ExistingTags # 既存タグ候補（使用頻度順）
│   └── SuggestedTags # AI新規提案タグ候補
├── TaskList         # タスク一覧
│   └── TaskItem     # 個別タスク
└── StatsPanel       # 統計情報表示
```

### 画面遷移
```
/ (ホーム)
├── タスク一覧表示
├── タスク作成フォーム
└── タスク編集モーダル
```

## 実装順序

### Phase 1: バックエンドAPI
1. Task構造体定義
2. POST /tasks (作成)
3. GET /tasks (一覧)  
4. PUT /tasks/:id (更新)
5. DELETE /tasks/:id (削除)

### Phase 2: フロントエンド
1. TaskForm コンポーネント
2. TaskList コンポーネント
3. API連携
4. 状態管理

### GET /tasks 設計

#### リクエスト形式
```http
GET /tasks?completed=false&limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

#### クエリパラメータ
```go
type GetTasksRequest struct {
    Completed *bool `form:"completed"`           // タスク完了状態フィルター (任意)
    Limit     int   `form:"limit,default=50"`    // 取得件数 (デフォルト:50, 最大:100)
    Offset    int   `form:"offset,default=0"`    // 取得開始位置
    Tags      string `form:"tags"`               // タグフィルター (カンマ区切り)
}
```

#### 成功レスポンス (200 OK)
```json
{
    "success": true,
    "data": {
        "tasks": [
            {
                "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
                "user_id": "user_12345",
                "title": "Go言語のAPI開発を学ぶ",
                "description": "Next.jsとの連携方法を習得する",
                "completed": false,
                "importance": 4,
                "cost": 3,
                "tags": ["プログラミング", "学習"],
                "created_at": "2025-11-27T15:55:00Z",
                "updated_at": "2025-11-27T15:55:00Z"
            }
        ],
        "pagination": {
            "total": 150,
            "limit": 50,
            "offset": 0,
            "has_next": true
        }
    }
}
```

#### 処理フロー
```
1. JWTトークン検証・user_id抽出
2. クエリパラメータ解析・バリデーション
3. DynamoDB Query実行 (user_id基準)
4. フィルター条件適用 (completed, tags)
5. ページネーション処理
6. レスポンス返却
```

### GET /tasks/:id 設計

#### リクエスト形式
```http
GET /tasks/01ARZ3NDEKTSV4RRFFQ69G5FAV
Authorization: Bearer <JWT_TOKEN>
```

#### 成功レスポンス (200 OK)
```json
{
    "success": true,
    "data": {
        "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "user_id": "user_12345",
        "title": "Go言語のAPI開発を学ぶ",
        "description": "Next.jsとの連携方法を習得する",
        "completed": false,
        "importance": 4,
        "cost": 3,
        "tags": ["プログラミング", "学習"],
        "created_at": "2025-11-27T15:55:00Z",
        "updated_at": "2025-11-27T15:55:00Z"
    }
}
```

#### エラーレスポンス (404 Not Found)
```json
{
    "success": false,
    "error": {
        "code": "TASK_NOT_FOUND",
        "message": "指定されたタスクが見つかりません"
    }
}
```

#### 処理フロー
```
1. JWTトークン検証・user_id抽出
2. パスからtask_id取得
3. DynamoDB GetItem実行 (user_id + id)
4. タスク存在チェック
5. レスポンス返却
```

### PUT /tasks/:id 設計

#### リクエスト形式
```json
PUT /tasks/01ARZ3NDEKTSV4RRFFQ69G5FAV
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
    "title": "Go言語のAPI開発をマスター",
    "description": "Next.jsとの連携とテストも習得する",
    "completed": true,
    "importance": 5,
    "cost": 4,
    "tags": ["プログラミング", "学習", "完了"]
}
```

#### バリデーション
```go
type UpdateTaskRequest struct {
    Title       *string   `json:"title" validate:"omitempty,max=100"`
    Description *string   `json:"description" validate:"omitempty,max=500"`
    Completed   *bool     `json:"completed"`
    Importance  *int      `json:"importance" validate:"omitempty,min=1,max=5"`
    Cost        *int      `json:"cost" validate:"omitempty,min=1,max=5"`
    Tags        *[]string `json:"tags" validate:"omitempty,max=10,dive,max=30"`
}
```

#### 成功レスポンス (200 OK)
```json
{
    "success": true,
    "data": {
        "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
        "user_id": "user_12345",
        "title": "Go言語のAPI開発をマスター",
        "description": "Next.jsとの連携とテストも習得する",
        "completed": true,
        "importance": 5,
        "cost": 4,
        "tags": ["プログラミング", "学習", "完了"],
        "created_at": "2025-11-27T15:55:00Z",
        "updated_at": "2025-11-27T16:15:00Z"
    }
}
```

#### 処理フロー
```
1. JWTトークン検証・user_id抽出
2. パスからtask_id取得
3. リクエストボディ解析・バリデーション
4. DynamoDB GetItem で存在チェック
5. 更新データ準備 (updated_at設定)
6. DynamoDB UpdateItem実行
7. レスポンス返却
```

### DELETE /tasks/:id 設計

#### リクエスト形式
```http
DELETE /tasks/01ARZ3NDEKTSV4RRFFQ69G5FAV
Authorization: Bearer <JWT_TOKEN>
```

#### 成功レスポンス (200 OK)
```json
{
    "success": true,
    "message": "タスクが正常に削除されました"
}
```

#### エラーレスポンス (404 Not Found)
```json
{
    "success": false,
    "error": {
        "code": "TASK_NOT_FOUND",
        "message": "指定されたタスクが見つかりません"
    }
}
```

#### 処理フロー
```
1. JWTトークン検証・user_id抽出
2. パスからtask_id取得
3. DynamoDB GetItem で存在チェック
4. DynamoDB DeleteItem実行
5. レスポンス返却
```

---
設計変更時は理由と共に記録