package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"my-webapp-backend/models"
)

type BGMRepository struct {
	db        *dynamodb.Client
	TableName string
}

func NewBGMRepository(db *dynamodb.Client, tableName string) *BGMRepository {
	return &BGMRepository{db: db, TableName: tableName}
}

func bgmPK(userID string) string   { return "USER#" + userID }
func bgmSK(presetID string) string { return "BGM#" + presetID }

func (r *BGMRepository) CreatePreset(ctx context.Context, userID string, preset *models.BGMPreset) error {
	preset.PK = bgmPK(userID)
	preset.SK = bgmSK(preset.PresetID)

	item, err := attributevalue.MarshalMap(preset)
	if err != nil {
		return fmt.Errorf("failed to marshal preset: %w", err)
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

func (r *BGMRepository) GetPresets(ctx context.Context, userID string) ([]models.BGMPreset, error) {
	keyCond := expression.Key("pk").Equal(expression.Value(bgmPK(userID))).
		And(expression.Key("sk").BeginsWith("BGM#"))

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).Build()
	if err != nil {
		return nil, fmt.Errorf("failed to build expression: %w", err)
	}

	result, err := r.db.Query(ctx, &dynamodb.QueryInput{
		TableName:                 aws.String(r.TableName),
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to query presets: %w", err)
	}

	var presets []models.BGMPreset
	for _, item := range result.Items {
		var p models.BGMPreset
		if err := attributevalue.UnmarshalMap(item, &p); err != nil {
			return nil, fmt.Errorf("failed to unmarshal preset: %w", err)
		}
		presets = append(presets, p)
	}
	return presets, nil
}

func (r *BGMRepository) DeletePreset(ctx context.Context, userID, presetID string) error {
	_, err := r.db.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: bgmPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: bgmSK(presetID)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}
	return nil
}
