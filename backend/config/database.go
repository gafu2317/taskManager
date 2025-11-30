package config

import (
	"context"
	
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type DynamoDBClient struct {
	Client    *dynamodb.Client
	TableName string
}

func NewDynamoDBClient() (*DynamoDBClient, error) {
	// AWS設定のロード
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-1"), // リージョンを指定
		config.WithCredentialsProvider(aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     "dummy",
				SecretAccessKey: "dummy",
		}, nil
		})),
	)
	if err != nil {
		return nil, err
	}
	// ローカルDynamoDB用のエンドポイント設定
	cfg.BaseEndpoint = aws.String("http://localhost:8001")
	client := dynamodb.NewFromConfig(cfg)

	return &DynamoDBClient{
		Client:    client,
		TableName: "Tasks", // テーブル名を指定
	}, nil
}