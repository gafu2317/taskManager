# マスコット育成機能 タスク一覧

設計詳細: `docs/mascot-design.md`

## タスク一覧

| # | タスク | 依存 | 状態 |
|---|---|---|---|
| T01 | バックエンド: Mascotモデル作成 | なし | ⬜ 未着手 |
| T02 | バックエンド: MascotRepository作成 | T01 | ⬜ 未着手 |
| T03 | バックエンド: ハンドラ + ルート追加 | T02 | ⬜ 未着手 |
| T04 | バックエンド: Cloud Runデプロイ | T03 | ⬜ 未着手 |
| T05 | フロントエンド: 型定義更新 | なし | ⬜ 未着手 |
| T06 | フロントエンド: APIクライアント追加 | T04, T05 | ⬜ 未着手 |
| T07 | フロントエンド: useMascotフック拡張 | T06 | ⬜ 未着手 |
| T08 | フロントエンド: 性格パラメータ配分UI | T07 | ⬜ 未着手 |
| T09 | フロントエンド: ショップ・装備UI | T07 | ⬜ 未着手 |
| T10 | フロントエンド: タスク完了・セッション終了との連携 | T06 | ⬜ 未着手 |

## 各タスクのドキュメント

- [T01 - Mascotモデル](./T01-mascot-model.md)
- [T02 - MascotRepository](./T02-mascot-repository.md)
- [T03 - ハンドラ + ルート](./T03-mascot-handlers.md)
- [T04 - Cloud Runデプロイ](./T04-deploy.md)
- [T05 - 型定義更新](./T05-types.md)
- [T06 - APIクライアント](./T06-api-client.md)
- [T07 - useMascotフック](./T07-useMascot-hook.md)
- [T08 - 性格パラメータUI](./T08-personality-ui.md)
- [T09 - ショップ・装備UI](./T09-shop-ui.md)
- [T10 - 機能連携](./T10-integration.md)
