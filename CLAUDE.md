# CLAUDE.md - プロジェクト設定

## プロジェクト概要
- **名前**: タスクマネージャー
- **目的**: Web開発技術スタックの学習・実践
- **技術**: Go + Next.js + DynamoDB + AWS

## 現在の環境状況
- **DynamoDB Local**: ポート8001で稼働中
- **Next.js Dev Server**: ポート3000で稼働中  
- **Go API Server**: ポート8080で稼働中
- **テストテーブル**: "TaskManagerTest" 作成済み

## 学習進捗

### 理解済み技術
✅ **Docker Compose** - DynamoDBローカル環境構築
✅ **Go + Gin** - APIサーバーの基本構造、healthCheckエンドポイント
✅ **Next.js** - 開発サーバー起動、基本概念
✅ **GitHub Actions** - CI/CDパイプライン、自動テスト
✅ **AWS SDK** - DynamoDBローカル接続、テーブル操作

### 重要な学習ポイント
- テストは重要度で優先順位をつける（1:1不要）
- Go言語: 関数定義、ポインタ、gin.Context
- 開発サイクル: 設計→実装→テスト→デプロイ
- 自動記録システム: エラー・進捗を自動でファイル更新

## ファイル構成
- **CLAUDE.md**: メイン設定（このファイル）
- **CLAUDE-ERRORS.md**: エラー対処記録（自動更新）
- **CLAUDE-PLAN.md**: 実装計画・進捗管理
- **CLAUDE-COMMANDS.md**: コマンド辞書

## 開発方針
- 実際に動かして体験重視
- 一つずつ技術を理解してから次に進む
- エラー・進捗は自動記録