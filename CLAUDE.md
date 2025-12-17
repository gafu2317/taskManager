# CLAUDE.md - プロジェクト設定

## プロジェクト概要
- **名前**: タスクマネージャー
- **目的**: Web開発技術スタックの学習・実践
- **技術**: Go + Next.js + DynamoDB + AWS

## 現在の環境状況
- **DynamoDB Local**: ポート8001で稼働中（現在は未使用、メモリベース開発）
- **Next.js Dev Server**: ポート3000で稼働中  
- **Go API Server**: ポート8080で稼働中

## フロントエンドの規定
---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## 学習進捗

### 理解済み技術
✅ **Docker Compose** - DynamoDBローカル環境構築
✅ **Go + Gin** - APIサーバーの基本構造、healthCheckエンドポイント
✅ **Next.js** - 開発サーバー起動、基本概念
✅ **GitHub Actions** - CI/CDパイプライン、自動テスト
✅ **AWS SDK** - DynamoDBローカル接続、テーブル操作

### 重要な学習ポイント
- Go言語: 関数定義、ポインタ、gin.Context、Repository パターン
- 開発サイクル: 設計→実装→テスト→デプロイ
- Enterキーベースのタグ入力システム実装

## ファイル構成
- **CLAUDE.md**: メイン設定（このファイル）

## 開発方針
- 実際に動かして体験重視
- 一つずつ技術を理解してから次に進む

## TODO
- [ ] ログイン機能
- [ ] 右下にマスコット配置
- [ ] タスクの内容の編集
- [ ] タグの提案機能
- [ ] 作業モードの実装
- [ ] GSAPを使ったタスクバブルの模様替え
- [ ] タグでフィルターして表示

## 重要な協力方針
### 学習・成長重視
- **必ず提案ベース**: AIが勝手に決めず、必ず選択肢を提示して決定は私が行う
- **思考の機会提供**: ユーザーが考える必要を与える質問・提案形式
- **ユーザーが実装**: コードはユーザーが書くことを前提とした指導・サポート

### AIの役割
- 技術選択肢の提示と比較
- 設計案の提案と説明
- 実装時のガイダンスとレビュー
- エラー解決のヒント提供

### 私の役割  
- 最終的な技術選択・決定
- 設計内容の判断・承認
- 実際のコード記述
- 学習内容の理解・習得

