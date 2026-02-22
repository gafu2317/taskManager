# T04: バックエンド - Cloud Runデプロイ

**依存**: T03（ハンドラ実装完了）
**次のタスク**: T06

---

## 目的

バックエンドの変更を Cloud Run に反映する。

## コマンド

```bash
cd backend
gcloud run deploy task-manager-backend --source . --region asia-northeast1
```

## デプロイ後の確認

```bash
curl -H "X-User-ID: test" \
  https://task-manager-backend-1008994672672.asia-northeast1.run.app/mascot
```

200 が返り、以下のような JSON が返ること：

```json
{
  "user_id": "test",
  "current_points": 0,
  "total_earned_points": 0,
  "personality_params": {
    "genki": 0,
    "kibishisa": 0,
    "amae": 0,
    "tsundere": 0,
    "majime": 0,
    "tennen": 0
  },
  "owned_accessories": [],
  "equipped_accessories": [],
  "last_login_date": "",
  "created_at": "0001-01-01T00:00:00Z",
  "updated_at": "0001-01-01T00:00:00Z"
}
```

## 完了条件

- Cloud Run に新しいリビジョンがデプロイされている
- `/mascot` エンドポイントが本番URLで疎通する
