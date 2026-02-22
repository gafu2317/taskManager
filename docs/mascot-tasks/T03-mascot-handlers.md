# T03: バックエンド - ハンドラ + ルート追加

**依存**: T02（MascotRepository）
**次のタスク**: T04

---

## 目的

マスコット関連の HTTP ハンドラを `main.go` に追加し、ルートを登録する。

## 変更するファイル

**変更**: `backend/main.go`

## 既存ハンドラの規約

```go
// ハンドラは gin.HandlerFunc を返すクロージャ
func createSession(sessionRepo *..., taskRepo *...) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetHeader("X-User-ID")
        if userID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
            return
        }
        // ...
    }
}
```

- 全ハンドラで `X-User-ID` ヘッダーチェックが必須
- エラーは `gin.H{"error": "..."}` 形式
- `context.TODO()` を使う

## 追加するエンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/mascot` | マスコットデータ取得 |
| POST | `/mascot/action` | ポイント付与アクション |
| POST | `/mascot/personality` | 性格パラメータ変更 |
| POST | `/mascot/shop/buy` | アクセサリー購入 |
| PUT | `/mascot/equip` | アクセサリー装備変更 |

---

## 各ハンドラの実装

### GET /mascot

```go
func getMascot(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetHeader("X-User-ID")
        if userID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
            return
        }
        mascot, err := mascotRepo.GetMascot(context.TODO(), userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
            return
        }
        c.JSON(http.StatusOK, mascot)
    }
}
```

---

### POST /mascot/action

ポイントを付与するアクション。アクション種別によって加算量が異なる。

**リクエスト**:
```json
{ "type": "task_complete" }
{ "type": "work_session", "work_seconds": 3600 }
{ "type": "login" }
```

**ポイント計算ロジック**:
- `task_complete`: +10 pt
- `work_session`: `floor(work_seconds / 1800) * 10` pt（30分=10pt、0分は0pt）
- `login`: 今日すでにログインボーナスを受け取っていれば 0pt、未受け取りなら +5pt
  - `LastLoginDate`（YYYY-MM-DD）と今日の日付を比較
  - ボーナス付与後は `LastLoginDate` を今日の日付に更新

```go
type mascotActionRequest struct {
    Type        string `json:"type"`          // "task_complete" / "work_session" / "login"
    WorkSeconds int    `json:"work_seconds"`  // work_session のみ使用
}

func postMascotAction(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetHeader("X-User-ID")
        if userID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
            return
        }

        var req mascotActionRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        mascot, err := mascotRepo.GetMascot(context.TODO(), userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
            return
        }

        earned := 0
        today := time.Now().Format("2006-01-02")

        switch req.Type {
        case "task_complete":
            earned = 10
        case "work_session":
            earned = (req.WorkSeconds / 1800) * 10
        case "login":
            if mascot.LastLoginDate != today {
                earned = 5
                mascot.LastLoginDate = today
            }
        default:
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action type"})
            return
        }

        mascot.CurrentPoints += earned
        mascot.TotalEarnedPoints += earned

        if err := mascotRepo.SaveMascot(context.TODO(), userID, mascot); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "earned_points":  earned,
            "current_points": mascot.CurrentPoints,
        })
    }
}
```

---

### POST /mascot/personality

性格パラメータを変更する。消費ポイント合計が所持ポイントを超えないよう検証。
リセット（全パラメータ0に戻す）の場合、投資分のポイントを全額返還する。

**リクエスト**:
```json
{
  "params": {
    "genki": 3,
    "kibishisa": 2,
    "amae": 0,
    "tsundere": 0,
    "majime": 1,
    "tennen": 0
  }
}
```

**バリデーション**:
- 各値 0〜10
- 投資コスト合計 = `(全パラメータの合計値) * 10` pt
- 新しい投資コスト ≤ `現所持ポイント + 以前の投資コスト`（再配分のため）

**ポイント計算**:
```
旧投資コスト = (旧パラメータ合計値) * 10
新投資コスト = (新パラメータ合計値) * 10
差分 = 新投資コスト - 旧投資コスト
新所持ポイント = 現所持ポイント - 差分
```

```go
type personalityRequest struct {
    Params models.PersonalityParams `json:"params"`
}

func postMascotPersonality(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetHeader("X-User-ID")
        if userID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
            return
        }

        var req personalityRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // バリデーション: 各値 0〜10
        p := req.Params
        if p.Genki < 0 || p.Genki > 10 ||
            p.Kibishisa < 0 || p.Kibishisa > 10 ||
            p.Amae < 0 || p.Amae > 10 ||
            p.Tsundere < 0 || p.Tsundere > 10 ||
            p.Majime < 0 || p.Majime > 10 ||
            p.Tennen < 0 || p.Tennen > 10 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "each parameter must be between 0 and 10"})
            return
        }

        mascot, err := mascotRepo.GetMascot(context.TODO(), userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
            return
        }

        old := mascot.PersonalityParams
        oldCost := (old.Genki + old.Kibishisa + old.Amae + old.Tsundere + old.Majime + old.Tennen) * 10
        newCost := (p.Genki + p.Kibishisa + p.Amae + p.Tsundere + p.Majime + p.Tennen) * 10
        diff := newCost - oldCost

        if mascot.CurrentPoints-diff < 0 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "not enough points"})
            return
        }

        mascot.PersonalityParams = p
        mascot.CurrentPoints -= diff

        if err := mascotRepo.SaveMascot(context.TODO(), userID, mascot); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
            return
        }

        c.JSON(http.StatusOK, mascot)
    }
}
```

---

### POST /mascot/shop/buy

アクセサリーを購入する。

**リクエスト**:
```json
{ "accessory_id": "hat" }
```

**バリデーション**:
- 有効な `accessory_id` か確認（定義済みリストと照合）
- すでに所有済みでないか確認
- 所持ポイントが足りるか確認

**アクセサリー定義**（ハードコード）:

```go
var accessoryPrices = map[string]int{
    "ribbon": 30,
    "hat":    50,
    "glasses": 80,
    "scarf":  40,
    "crown":  200,
}
```

```go
type shopBuyRequest struct {
    AccessoryID string `json:"accessory_id"`
}

func postMascotShopBuy(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetHeader("X-User-ID")
        if userID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
            return
        }

        var req shopBuyRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        price, ok := accessoryPrices[req.AccessoryID]
        if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid accessory_id"})
            return
        }

        mascot, err := mascotRepo.GetMascot(context.TODO(), userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
            return
        }

        for _, id := range mascot.OwnedAccessories {
            if id == req.AccessoryID {
                c.JSON(http.StatusBadRequest, gin.H{"error": "already owned"})
                return
            }
        }

        if mascot.CurrentPoints < price {
            c.JSON(http.StatusBadRequest, gin.H{"error": "not enough points"})
            return
        }

        mascot.CurrentPoints -= price
        mascot.OwnedAccessories = append(mascot.OwnedAccessories, req.AccessoryID)

        if err := mascotRepo.SaveMascot(context.TODO(), userID, mascot); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
            return
        }

        c.JSON(http.StatusOK, mascot)
    }
}
```

---

### PUT /mascot/equip

装備するアクセサリーの一覧を更新する。

**リクエスト**:
```json
{ "equipped": ["hat", "ribbon"] }
```

**バリデーション**:
- 指定したアクセサリーがすべて所有済みであること

```go
type equipRequest struct {
    Equipped []string `json:"equipped"`
}

func putMascotEquip(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetHeader("X-User-ID")
        if userID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
            return
        }

        var req equipRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        mascot, err := mascotRepo.GetMascot(context.TODO(), userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
            return
        }

        ownedSet := make(map[string]bool)
        for _, id := range mascot.OwnedAccessories {
            ownedSet[id] = true
        }
        for _, id := range req.Equipped {
            if !ownedSet[id] {
                c.JSON(http.StatusBadRequest, gin.H{"error": "accessory not owned: " + id})
                return
            }
        }

        mascot.EquippedAccessories = req.Equipped

        if err := mascotRepo.SaveMascot(context.TODO(), userID, mascot); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
            return
        }

        c.JSON(http.StatusOK, mascot)
    }
}
```

---

## main() への追加

`main()` 関数の初期化部分と、ルート登録部分に追加する。

```go
// 初期化
mascotRepo := repository.NewMascotRepository(dbClient.Client, tableName)

// ルート登録（既存のルートに追加）
r.GET("/mascot", getMascot(mascotRepo))
r.POST("/mascot/action", postMascotAction(mascotRepo))
r.POST("/mascot/personality", postMascotPersonality(mascotRepo))
r.POST("/mascot/shop/buy", postMascotShopBuy(mascotRepo))
r.PUT("/mascot/equip", putMascotEquip(mascotRepo))
```

## 完了条件

- 全ハンドラが `main.go` に追加されている
- ルートが登録されている
- `go build ./...` がエラーなく通る
- `curl -H "X-User-ID: test" http://localhost:8080/mascot` で200が返る
