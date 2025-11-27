package main

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func main() {
	fmt.Println("=== DynamoDB Local 接続テスト開始 ===")

	// DynamoDB Local用の設定
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-west-2"),
		config.WithCredentialsProvider(credentials.StaticCredentialsProvider{
			Value: aws.Credentials{
				AccessKeyID:     "dummy",
				SecretAccessKey: "dummy",
				Source:          "Hard-coded credentials; values are irrelevant for local testing",
			},
		}),
	)
	if err != nil {
		log.Fatalf("設定の読み込みに失敗: %v", err)
	}

	// DynamoDB Local のエンドポイントを設定
	client := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
		o.BaseEndpoint = aws.String("http://localhost:8001")
	})

	// テーブル一覧を取得してみる
	result, err := client.ListTables(context.TODO(), &dynamodb.ListTablesInput{})
	if err != nil {
		log.Fatalf("テーブル一覧の取得に失敗: %v", err)
	}

	fmt.Printf("✅ DynamoDB Local接続成功!\n")
	fmt.Printf("現在のテーブル数: %d\n", len(result.TableNames))

	// テストテーブルを作成してみる
	tableName := "TaskManagerTest"
	_, err = client.CreateTable(context.TODO(), &dynamodb.CreateTableInput{
		TableName: aws.String(tableName),
		KeySchema: []types.KeySchemaElement{
			{
				AttributeName: aws.String("id"),
				KeyType:       types.KeyTypeHash,
			},
		},
		AttributeDefinitions: []types.AttributeDefinition{
			{
				AttributeName: aws.String("id"),
				AttributeType: types.ScalarAttributeTypeS,
			},
		},
		BillingMode: types.BillingModePayPerRequest,
	})

	if err != nil {
		fmt.Printf("ℹ️ テーブル作成結果: %v\n", err)
	} else {
		fmt.Printf("✅ テストテーブル '%s' を作成しました\n", tableName)
	}

	// 作成後のテーブル一覧を再取得
	result, err = client.ListTables(context.TODO(), &dynamodb.ListTablesInput{})
	if err != nil {
		log.Fatalf("テーブル一覧の再取得に失敗: %v", err)
	}

	fmt.Printf("更新後のテーブル数: %d\n", len(result.TableNames))
	fmt.Println("テーブル一覧:")
	for _, table := range result.TableNames {
		fmt.Printf("  - %s\n", table)
	}

	fmt.Println("=== DynamoDB Local 接続テスト完了 ===")
}