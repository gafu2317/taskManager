package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"my-webapp-backend/models"
)

type TagRepository struct {
	db				*dynamodb.Client
	TableName	string
}

func NewTagRepository(db *dynamodb.Client) *TagRepository {
	return &TagRepository{
		db: db,
		TableName: "Tags",
	}
}

func (r*TagRepository) UpsertTag(ctx context.Context, tag *models.Tag) error {
	item, err := attributevalue.MarshalMap(tag)
	if err != nil {
		return fmt.Errorf("failed to marshal tag: %w", err)
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

func (r *TagRepository) GetAllTags(ctx context.Context) ([]models.Tag, error) {
	// DynamoDB全件スキャン
	result, err := r.db.Scan(ctx, &dynamodb.ScanInput{
		TableName: aws.String(r.TableName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan items: %w", err)
	}

	//DynamoDBアイテムを構造体に変換
	var tags []models.Tag
	for _, item := range result.Items {
		var tag models.Tag
		err := attributevalue.UnmarshalMap(item, &tag)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

// GetTagByName - 名前でタグを取得
func (r *TagRepository) GetTagByName(ctx context.Context, name string) (*models.Tag, error) {
	result, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"id": &types.AttributeValueMemberS{Value: name}, // タグのIDは名前を使用
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	if result.Item == nil {
		return nil, nil // タグが見つからない場合
	}

	var tag models.Tag
	err = attributevalue.UnmarshalMap(result.Item, &tag)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}

	return &tag, nil
}