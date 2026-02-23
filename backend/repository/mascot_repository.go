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
	return &MascotRepository{
		db:        db,
		TableName: tableName,
	}
}

func mascotPK(userID string) string { return "USER#" + userID }

// slot=1 は既存データと互換性を保つため MASCOT#profile を使う
func mascotSK(slot int) string {
	if slot <= 1 {
		return "MASCOT#profile"
	}
	return fmt.Sprintf("MASCOT#slot:%d", slot)
}

// GetMascot - マスコットをGetItemで取得。存在しない場合はデフォルト値を返す
func (r *MascotRepository) GetMascot(ctx context.Context, userID string, slot int) (*models.Mascot, error) {
	result, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: mascotPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: mascotSK(slot)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	if result.Item == nil {
		now := time.Now()
		m := &models.Mascot{
			UserID:              userID,
			CurrentPoints:       0,
			TotalEarnedPoints:   0,
			PersonalityPreset:   "flat",
			UnlockedPresets:     []string{"flat"},
			OwnedAccessories:    []string{},
			EquippedAccessories: []string{},
			LastLoginDate:       now.Format("2006-01-02"),
			UnlockedSlots:       1,
			CreatedAt:           now,
			UpdatedAt:           now,
		}
		return m, nil
	}

	var mascot models.Mascot
	if err := attributevalue.UnmarshalMap(result.Item, &mascot); err != nil {
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}

	// 既存データの UnlockedSlots が 0 の場合は 1 に補正
	if mascot.UnlockedSlots < 1 {
		mascot.UnlockedSlots = 1
	}

	// 既存データの UnlockedPresets が nil の場合は補正
	if mascot.UnlockedPresets == nil {
		mascot.UnlockedPresets = []string{"flat"}
	}

	// 既存データの PersonalityPreset が空の場合は補正
	if mascot.PersonalityPreset == "" {
		mascot.PersonalityPreset = "flat"
	}

	return &mascot, nil
}

// SaveMascot - マスコットをPutItemで保存（Upsert）
func (r *MascotRepository) SaveMascot(ctx context.Context, userID string, slot int, mascot *models.Mascot) error {
	now := time.Now()
	mascot.PK = mascotPK(userID)
	mascot.SK = mascotSK(slot)
	mascot.UserID = userID
	mascot.UpdatedAt = now
	if mascot.CreatedAt.IsZero() {
		mascot.CreatedAt = now
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
		return fmt.Errorf("failed to put item: %w", err)
	}

	return nil
}
