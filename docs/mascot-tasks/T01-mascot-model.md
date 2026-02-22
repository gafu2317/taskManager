# T01: バックエンド - Mascotモデル作成

**依存**: なし
**次のタスク**: T02

---

## 目的

DynamoDBに保存するマスコットデータの Go struct を定義する。

## 作成するファイル

**新規作成**: `backend/models/mascot.go`

## 既存モデルの規約（`backend/models/task.go` より）

```go
package models

import "time"

type Task struct {
    PK  string `json:"-" dynamodbav:"pk"`
    SK  string `json:"-" dynamodbav:"sk"`
    // ...
    CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"`
    UpdatedAt time.Time `json:"updated_at" dynamodbav:"updated_at"`
}
```

- PK/SK は `json:"-"` で JSON から隠す
- フィールド名は `dynamodbav:"xxx"` タグで DynamoDB のキー名を指定
- JSON は snake_case

## DynamoDBのキー設計

```
PK: USER#<userID>
SK: MASCOT#profile   ← 固定（ユーザーごとに1件のみ）
```

## 実装内容

```go
package models

import "time"

// PersonalityParams - 性格パラメータ（各軸 0〜10、1Lv=10pt）
type PersonalityParams struct {
    Genki      int `json:"genki"      dynamodbav:"genki"`       // 元気
    Kibishisa  int `json:"kibishisa"  dynamodbav:"kibishisa"`   // 厳しさ
    Amae       int `json:"amae"       dynamodbav:"amae"`        // 甘え
    Tsundere   int `json:"tsundere"   dynamodbav:"tsundere"`    // ツンデレ
    Majime     int `json:"majime"     dynamodbav:"majime"`      // 真面目
    Tennen     int `json:"tennen"     dynamodbav:"tennen"`      // 天然
}

// Mascot - ユーザーのマスコットデータ
type Mascot struct {
    PK  string `json:"-" dynamodbav:"pk"`
    SK  string `json:"-" dynamodbav:"sk"`

    UserID            string            `json:"user_id"             dynamodbav:"user_id"`
    CurrentPoints     int               `json:"current_points"      dynamodbav:"current_points"`      // 所持ポイント（残高）
    TotalEarnedPoints int               `json:"total_earned_points" dynamodbav:"total_earned_points"` // 累計獲得ポイント
    PersonalityParams PersonalityParams `json:"personality_params"  dynamodbav:"personality_params"`  // 性格パラメータ
    OwnedAccessories  []string          `json:"owned_accessories"   dynamodbav:"owned_accessories"`   // 購入済みアクセサリーID
    EquippedAccessories []string        `json:"equipped_accessories" dynamodbav:"equipped_accessories"` // 装備中アクセサリーID
    LastLoginDate     string            `json:"last_login_date"     dynamodbav:"last_login_date"`     // YYYY-MM-DD
    CreatedAt         time.Time         `json:"created_at"          dynamodbav:"created_at"`
    UpdatedAt         time.Time         `json:"updated_at"          dynamodbav:"updated_at"`
}
```

## 補足

- `PersonalityParams` の各値は **0〜10** の範囲
- 1レベル上げるコストは **10pt**（固定）
- 所持ポイントの消費先は「性格パラメータ投資」と「アクセサリー購入」の2種類
  - 性格パラメータ: リセット（全額返還）可能
  - アクセサリー購入: 永続消費（返還なし）
- `OwnedAccessories` / `EquippedAccessories` は string スライス
  - nil の代わりに空スライスで初期化すること（JSON で `null` にならないよう）

## 完了条件

- `backend/models/mascot.go` が作成されている
- `go build ./...` がエラーなく通る
