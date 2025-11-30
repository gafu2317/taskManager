package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"my-webapp-backend/models"
)

type TaskRepository struct {
	db				*dynamodb.Client
	TableName	string
}

func NewTaskRepository(db *dynamodb.Client) *TaskRepository {
	return &TaskRepository{
		db: db,
		TableName: "Tasks",
	}
}

//CreateTask - タスクをDynamoDBに保存
func (r *TaskRepository) CreateTask(ctx context.Context, task *models.Task) error {
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

  // GetTasks - 全タスクを DynamoDBから取得
func (r *TaskRepository) GetTasks(ctx context.Context) ([]models.Task, error) {
	// DynamoDB全件スキャン
	result, err := r.db.Scan(ctx, &dynamodb.ScanInput{
		TableName: aws.String(r.TableName),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to scan items: %w", err)
	}

	//DynamoDBアイテムを構造体に変換
	var tasks []models.Task
	for _, item := range result.Items {
		var task models.Task
		err := attributevalue.UnmarshalMap(item, &task)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		tasks = append(tasks, task)
	}
	
	return tasks, nil
}