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

## 🧪 テスト・ビルドコマンド

### テスト実行
```bash
# バックエンドテスト
cd backend
go test -v ./...                    # 詳細表示
go test                            # 簡潔表示
go test ./... -cover               # カバレッジ表示

# フロントエンドテスト
cd frontend  
npm run test                       # 一回実行
npm run test:watch                 # ファイル変更監視
npm run test:coverage              # カバレッジ表示
```

### ビルド確認
```bash
# バックエンドビルド
cd backend
go build -v ./...                  # 詳細表示
go build                          # 実行ファイル作成

# フロントエンドビルド
cd frontend
npm run build                     # 本番ビルド
npm run start                     # ビルド後起動確認
```

## 🔧 開発ツールコマンド

### Go関連
```bash
# 依存関係管理
go mod tidy                       # 未使用パッケージ削除、不足パッケージ追加
go mod download                   # パッケージダウンロード
go mod init project-name          # 新しいモジュール初期化

# コード整形
go fmt ./...                      # 全ファイル整形
go vet ./...                      # コード検査

# パッケージ情報
go list -m all                    # 全依存関係表示
go version                        # Goバージョン確認
```

### npm関連
```bash
# 依存関係管理
npm install                       # package.jsonから全インストール
npm ci                           # package-lock.jsonから高速インストール
npm update                       # パッケージ更新

# パッケージ操作
npm install package-name          # 新しいパッケージ追加
npm uninstall package-name        # パッケージ削除
npm list                         # インストール済みパッケージ一覧

# 開発ツール
npm run lint                     # ESLint実行
npm run lint:fix                 # ESLint自動修正
npm run type-check               # TypeScript型チェック
```

## 🐳 Docker関連コマンド

### Docker Compose
```bash
# 起動・停止
docker-compose up                # フォアグラウンド起動
docker-compose up -d             # バックグラウンド起動
docker-compose down              # 停止・削除
docker-compose restart          # 再起動

# 状態確認
docker-compose ps               # コンテナ状態確認
docker-compose logs             # ログ確認
docker-compose logs -f          # ログをリアルタイム表示

# データ操作
docker-compose down -v          # ボリューム含めて削除
```

### Docker基本操作
```bash
# コンテナ操作
docker ps                       # 実行中コンテナ一覧
docker ps -a                    # 全コンテナ一覧
docker stop container-name      # コンテナ停止
docker rm container-name        # コンテナ削除

# イメージ操作
docker images                   # イメージ一覧
docker pull image-name          # イメージダウンロード
docker rmi image-name           # イメージ削除
```

## 🌐 API テストコマンド

### curl を使ったAPIテスト
```bash
# ヘルスチェック
curl http://localhost:8080/health

# タスク一覧取得
curl http://localhost:8080/tasks

# タスク作成
curl -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"テストタスク","description":"テスト用のタスクです"}'

# タスク更新
curl -X PUT http://localhost:8080/tasks/123 \
  -H "Content-Type: application/json" \
  -d '{"title":"更新されたタスク","completed":true}'

# タスク削除
curl -X DELETE http://localhost:8080/tasks/123
```

### httpie を使ったAPIテスト (より読みやすい)
```bash
# インストール (一度のみ)
brew install httpie

# 使用例
http GET localhost:8080/health
http POST localhost:8080/tasks title="新しいタスク" description="説明"
http PUT localhost:8080/tasks/123 completed:=true
http DELETE localhost:8080/tasks/123
```

## 🔍 デバッグ・診断コマンド

### ポート確認
```bash
# 特定ポート使用状況
lsof -i :8080                   # Go APIサーバー
lsof -i :3000                   # Next.js
lsof -i :8001                   # DynamoDB Local

# 全てのリスニングポート確認
lsof -i -P -n | grep LISTEN
```

### プロセス確認
```bash
# Go関連プロセス
ps aux | grep "go run"

# npm関連プロセス
ps aux | grep "npm"
ps aux | grep "node"

# Docker関連プロセス  
ps aux | grep "docker"
```

### システムリソース確認
```bash
# CPU・メモリ使用率
top
htop                           # より見やすい (brew install htop)

# ディスク使用量
df -h                          # 全体
du -sh *                       # 現在ディレクトリの各フォルダサイズ
```

## 📝 Git関連コマンド

### 基本操作
```bash
# 現在の状態確認
git status
git log --oneline -10          # 最新10コミットを1行表示

# ブランチ操作
git checkout -b feature/new-feature    # 新しいブランチ作成・切り替え
git checkout main                      # mainブランチに切り替え
git branch                            # ローカルブランチ一覧

# コミット・プッシュ
git add .
git commit -m "commit message"
git push origin branch-name
```

## 🆘 緊急事態コマンド

### 全サービス強制停止
```bash
# Docker全停止
docker stop $(docker ps -q)

# ポート8080のプロセス強制終了
lsof -ti:8080 | xargs kill -9

# ポート3000のプロセス強制終了  
lsof -ti:3000 | xargs kill -9
```

### 環境リセット
```bash
# Dockerコンテナ・ボリューム全削除
docker-compose down -v
docker system prune -f

# node_modules再インストール
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 よく使うワンライナー

```bash
# 開発環境一括起動
docker-compose up -d && (cd frontend && npm run dev) & (cd backend && go run main.go)

# 全テスト実行
(cd backend && go test -v ./...) && (cd frontend && npm run test)

# 全サービス状態確認
echo "=== Docker ===" && docker ps && echo "=== Ports ===" && lsof -i :8001,:3000,:8080
```