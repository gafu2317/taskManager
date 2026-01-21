# CLAUDE-COMMANDS.md - コマンド集

## 🚀 開発環境起動コマンド

### 全サービス起動 (推奨)
```bash
# 1. DynamoDBローカル起動
docker-compose up -d

# 2. フロントエンド開発サーバー起動
cd frontend
npm run dev

# 3. バックエンドAPIサーバー起動 (別ターミナル)
cd backend
go run main.go
```

### 各サービス個別起動
```bash
# DynamoDBのみ起動
docker-compose up -d

# フロントエンドのみ起動
cd frontend && npm run dev

# バックエンドのみ起動  
cd backend && go run main.go
```

### サービス停止
```bash
# 全て停止
docker-compose down
# Ctrl+C でサーバー停止

# Dockerコンテナ確認
docker ps
```
