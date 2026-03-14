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

type HabitRepository struct {
	db        *dynamodb.Client
	TableName string
}

func NewHabitRepository(db *dynamodb.Client, tableName string) *HabitRepository {
	return &HabitRepository{
		db:        db,
		TableName: tableName,
	}
}

func habitPK(userID string) string              { return "USER#" + userID }
func habitSK(habitID string) string             { return "HABIT#" + habitID }
func habitRecordSK(habitID, date string) string { return "HABITREC#" + habitID + "#" + date }

// CreateHabit - 習慣を保存
func (r *HabitRepository) CreateHabit(ctx context.Context, userID string, habit *models.Habit) error {
	habit.PK = habitPK(userID)
	habit.SK = habitSK(habit.ID)

	item, err := attributevalue.MarshalMap(habit)
	if err != nil {
		return fmt.Errorf("failed to marshal habit: %w", err)
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

// GetHabits - 習慣一覧を取得
func (r *HabitRepository) GetHabits(ctx context.Context, userID string) ([]models.Habit, error) {
	pk := habitPK(userID)

	keyCond := expression.Key("pk").Equal(expression.Value(pk)).
		And(expression.Key("sk").BeginsWith("HABIT#"))

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

	var habits []models.Habit
	for _, item := range result.Items {
		var habit models.Habit
		if err := attributevalue.UnmarshalMap(item, &habit); err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		habits = append(habits, habit)
	}

	return habits, nil
}

// GetHabit - 特定習慣を取得
func (r *HabitRepository) GetHabit(ctx context.Context, userID, habitID string) (*models.Habit, error) {
	result, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: habitPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: habitSK(habitID)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}
	if result.Item == nil {
		return nil, nil
	}
	var habit models.Habit
	if err := attributevalue.UnmarshalMap(result.Item, &habit); err != nil {
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}
	return &habit, nil
}

// UpdateHabit - 習慣を更新（PutItemで上書き）
func (r *HabitRepository) UpdateHabit(ctx context.Context, userID string, habit *models.Habit) error {
	habit.PK = habitPK(userID)
	habit.SK = habitSK(habit.ID)

	item, err := attributevalue.MarshalMap(habit)
	if err != nil {
		return fmt.Errorf("failed to marshal habit: %w", err)
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

// DeleteHabit - 習慣を削除
func (r *HabitRepository) DeleteHabit(ctx context.Context, userID, habitID string) error {
	_, err := r.db.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: habitPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: habitSK(habitID)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	return nil
}

// UpsertHabitRecord - 習慣記録を保存（同一habitId+dateは上書き）
func (r *HabitRepository) UpsertHabitRecord(ctx context.Context, userID string, record *models.HabitRecord) error {
	record.PK = habitPK(userID)
	record.SK = habitRecordSK(record.HabitID, record.Date)

	item, err := attributevalue.MarshalMap(record)
	if err != nil {
		return fmt.Errorf("failed to marshal habit record: %w", err)
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

// GetHabitRecords - 習慣記録を日付範囲で取得
func (r *HabitRepository) GetHabitRecords(ctx context.Context, userID, habitID, dateFrom, dateTo string) ([]models.HabitRecord, error) {
	pk := habitPK(userID)

	var keyCond expression.KeyConditionBuilder
	if dateFrom != "" && dateTo != "" {
		skFrom := "HABITREC#" + habitID + "#" + dateFrom
		skTo := "HABITREC#" + habitID + "#" + dateTo + "~"
		keyCond = expression.Key("pk").Equal(expression.Value(pk)).
			And(expression.Key("sk").Between(expression.Value(skFrom), expression.Value(skTo)))
	} else {
		keyCond = expression.Key("pk").Equal(expression.Value(pk)).
			And(expression.Key("sk").BeginsWith("HABITREC#" + habitID + "#"))
	}

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

	var records []models.HabitRecord
	for _, item := range result.Items {
		var record models.HabitRecord
		if err := attributevalue.UnmarshalMap(item, &record); err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		records = append(records, record)
	}

	return records, nil
}
