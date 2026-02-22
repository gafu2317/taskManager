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

type TagRepository struct {
	db        *dynamodb.Client
	TableName string
}

func NewTagRepository(db *dynamodb.Client, tableName string) *TagRepository {
	return &TagRepository{
		db:        db,
		TableName: tableName,
	}
}

func tagPK(userID string) string { return "USER#" + userID }
func tagSK(name string) string   { return "TAG#" + name }

// UpsertTag - タグを作成または更新
func (r *TagRepository) UpsertTag(ctx context.Context, userID string, tag *models.Tag) error {
	tag.PK = tagPK(userID)
	tag.SK = tagSK(tag.Name)

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

// GetTagsByUser - ユーザーのタグ一覧をQueryで取得
func (r *TagRepository) GetTagsByUser(ctx context.Context, userID string) ([]models.Tag, error) {
	keyCond := expression.Key("pk").Equal(expression.Value(tagPK(userID))).
		And(expression.Key("sk").BeginsWith("TAG#"))

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
		return nil, fmt.Errorf("failed to query items: %w", err)
	}

	var tags []models.Tag
	for _, item := range result.Items {
		var tag models.Tag
		if err := attributevalue.UnmarshalMap(item, &tag); err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

// GetTagByName - 名前でタグをGetItem
func (r *TagRepository) GetTagByName(ctx context.Context, userID string, name string) (*models.Tag, error) {
	result, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: tagPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: tagSK(name)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	if result.Item == nil {
		return nil, nil
	}

	var tag models.Tag
	if err := attributevalue.UnmarshalMap(result.Item, &tag); err != nil {
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}

	return &tag, nil
}
