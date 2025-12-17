package config

import (
	"context"
	
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type DynamoDBClient struct {
	Client    *dynamodb.Client
	TableName string
}

func NewDynamoDBClient() (*DynamoDBClient, error) {
	// AWS設定のロード（AWS認証情報は~/.aws/credentialsから自動読み込み）
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("ap-northeast-1"), // 東京リージョンを指定
	)
	if err != nil {
		return nil, err
	}
	
	client := dynamodb.NewFromConfig(cfg)

	return &DynamoDBClient{
		Client:    client,
		TableName: "Tasks", // テーブル名を指定
	}, nil
}