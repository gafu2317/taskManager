package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"my-webapp-backend/models"
)

type SessionRepository struct {
	db        *dynamodb.Client
	TableName string
}

func NewSessionRepository(db *dynamodb.Client, tableName string) *SessionRepository {
	return &SessionRepository{
		db:        db,
		TableName: tableName,
	}
}

func sessionPK(userID string) string              { return "USER#" + userID }
func sessionSK(date, sessionID string) string     { return "SESSION#" + date + "#" + sessionID }

// CreateSession - セッションを保存
func (r *SessionRepository) CreateSession(ctx context.Context, userID string, session *models.WorkSession) error {
	session.PK = sessionPK(userID)
	session.SK = sessionSK(session.Date, session.SessionID)

	item, err := attributevalue.MarshalMap(session)
	if err != nil {
		return fmt.Errorf("failed to marshal session: %w", err)
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

// GetSessions - セッション一覧を日付範囲でQuery
func (r *SessionRepository) GetSessions(ctx context.Context, userID, dateFrom, dateTo string) ([]models.WorkSession, error) {
	pk := sessionPK(userID)

	var keyCond expression.KeyConditionBuilder
	if dateFrom != "" && dateTo != "" {
		// '~' (0x7E) は '#' (0x23) より大きいため dateTo の全セッションを包含
		skFrom := "SESSION#" + dateFrom
		skTo := "SESSION#" + dateTo + "~"
		keyCond = expression.Key("pk").Equal(expression.Value(pk)).
			And(expression.Key("sk").Between(expression.Value(skFrom), expression.Value(skTo)))
	} else {
		keyCond = expression.Key("pk").Equal(expression.Value(pk)).
			And(expression.Key("sk").BeginsWith("SESSION#"))
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

	var sessions []models.WorkSession
	for _, item := range result.Items {
		var session models.WorkSession
		if err := attributevalue.UnmarshalMap(item, &session); err != nil {
			return nil, fmt.Errorf("failed to unmarshal item: %w", err)
		}
		sessions = append(sessions, session)
	}

	return sessions, nil
}
