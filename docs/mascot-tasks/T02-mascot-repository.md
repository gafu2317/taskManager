# T02: バックエンド - MascotRepository作成

**依存**: T01（Mascotモデル）
**次のタスク**: T03

---

## 目的

マスコットデータの DynamoDB 読み書きを担う Repository を実装する。

## 作成するファイル

**新規作成**: `backend/repository/mascot_repository.go`

## 既存 Repository の規約（`backend/repository/task_repository.go` より）

```go
package repository

type TaskRepository struct {
    db        *dynamodb.Client
    TableName string
}

func NewTaskRepository(db *dynamodb.Client, tableName string) *TaskRepository { ... }

func taskPK(userID string) string { return "USER#" + userID }
func taskSK(taskID string) string  { return "TASK#" + taskID }
```

- `PutItem` で作成・更新を兼ねる（Upsert）
- `GetItem` で単一取得
- キーは `USER#<id>` / `TASK#<id>` の形式
- 使用パッケージ: `aws-sdk-go-v2/service/dynamodb`, `aws-sdk-go-v2/feature/dynamodb/attributevalue`

## DynamoDBキー

```go
func mascotPK(userID string) string { return "USER#" + userID }
func mascotSK() string              { return "MASCOT#profile" }  // 固定
```

## 実装内容

```go
package repository

import (
    "context"
    "fmt"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
    "my-webapp-backend/models"
)

type MascotRepository struct {
    db        *dynamodb.Client
    TableName string
}

func NewMascotRepository(db *dynamodb.Client, tableName string) *MascotRepository {
    return &MascotRepository{db: db, TableName: tableName}
}

func mascotPK(userID string) string { return "USER#" + userID }
func mascotSK() string              { return "MASCOT#profile" }

// GetMascot - マスコットデータを取得。存在しない場合は初期データを返す
func (r *MascotRepository) GetMascot(ctx context.Context, userID string) (*models.Mascot, error) {
    result, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
        TableName: aws.String(r.TableName),
        Key: map[string]types.AttributeValue{
            "pk": &types.AttributeValueMemberS{Value: mascotPK(userID)},
            "sk": &types.AttributeValueMemberS{Value: mascotSK()},
        },
    })
    if err != nil {
        return nil, fmt.Errorf("failed to get mascot: %w", err)
    }

    if result.Item == nil {
        // 初回: デフォルト値で返す（DBには保存しない）
        return &models.Mascot{
            UserID:              userID,
            CurrentPoints:       0,
            TotalEarnedPoints:   0,
            PersonalityParams:   models.PersonalityParams{},
            OwnedAccessories:    []string{},
            EquippedAccessories: []string{},
            LastLoginDate:       "",
        }, nil
    }

    var mascot models.Mascot
    if err := attributevalue.UnmarshalMap(result.Item, &mascot); err != nil {
        return nil, fmt.Errorf("failed to unmarshal mascot: %w", err)
    }
    // nil スライスを空スライスに正規化
    if mascot.OwnedAccessories == nil {
        mascot.OwnedAccessories = []string{}
    }
    if mascot.EquippedAccessories == nil {
        mascot.EquippedAccessories = []string{}
    }
    return &mascot, nil
}

// SaveMascot - マスコットデータを保存（作成・更新兼用）
func (r *MascotRepository) SaveMascot(ctx context.Context, userID string, mascot *models.Mascot) error {
    mascot.PK = mascotPK(userID)
    mascot.SK = mascotSK()
    mascot.UserID = userID
    mascot.UpdatedAt = time.Now()
    if mascot.CreatedAt.IsZero() {
        mascot.CreatedAt = mascot.UpdatedAt
    }

    item, err := attributevalue.MarshalMap(mascot)
    if err != nil {
        return fmt.Errorf("failed to marshal mascot: %w", err)
    }

    _, err = r.db.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(r.TableName),
        Item:      item,
    })
    if err != nil {
        return fmt.Errorf("failed to put mascot: %w", err)
    }
    return nil
}
```

## 完了条件

- `backend/repository/mascot_repository.go` が作成されている
- `go build ./...` がエラーなく通る
