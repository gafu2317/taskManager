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

type TaskRepository struct {
	db        *dynamodb.Client
	TableName string
}

func NewTaskRepository(db *dynamodb.Client, tableName string) *TaskRepository {
	return &TaskRepository{
		db:        db,
		TableName: tableName,
	}
}

func taskPK(userID string) string { return "USER#" + userID }
func taskSK(taskID string) string  { return "TASK#" + taskID }

// CreateTask - タスクをDynamoDBに保存
func (r *TaskRepository) CreateTask(ctx context.Context, userID string, task *models.Task) error {
	task.PK = taskPK(userID)
	task.SK = taskSK(task.ID)

	item, err := attributevalue.MarshalMap(task)
	if err != nil {
		return fmt.Errorf("failed to marshal task: %w", err)
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

// GetTasks - ユーザーのタスク一覧をQueryで取得
func (r *TaskRepository) GetTasks(ctx context.Context, userID string) ([]models.Task, error) {
	keyCond := expression.Key("pk").Equal(expression.Value(taskPK(userID))).
		And(expression.Key("sk").BeginsWith("TASK#"))

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

	var tasks []models.Task
	for _, item := range result.Items {
		var task models.Task
		if err := attributevalue.UnmarshalMap(item, &task); err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		tasks = append(tasks, task)
	}

	return tasks, nil
}

// GetTask - 特定タスクをGetItemで取得
func (r *TaskRepository) GetTask(ctx context.Context, userID string, taskID string) (*models.Task, error) {
	result, err := r.db.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: taskPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: taskSK(taskID)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	if result.Item == nil {
		return nil, nil
	}

	var task models.Task
	if err := attributevalue.UnmarshalMap(result.Item, &task); err != nil {
		return nil, fmt.Errorf("failed to unmarshal item: %w", err)
	}

	return &task, nil
}

// UpdateTask - タスクを更新
func (r *TaskRepository) UpdateTask(ctx context.Context, userID string, taskID string, task *models.Task) error {
	task.PK = taskPK(userID)
	task.SK = taskSK(taskID)

	item, err := attributevalue.MarshalMap(task)
	if err != nil {
		return fmt.Errorf("failed to marshal task: %w", err)
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

// DeleteTask - タスクを削除
func (r *TaskRepository) DeleteTask(ctx context.Context, userID string, taskID string) error {
	_, err := r.db.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(r.TableName),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: taskPK(userID)},
			"sk": &types.AttributeValueMemberS{Value: taskSK(taskID)},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to delete item: %w", err)
	}

	return nil
}
