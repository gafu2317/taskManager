import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface TaskFromBackend {
  title: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  // 認証チェック
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) return NextResponse.json({ tags: [] }, { status: 401 });

  const body = await req.json();
  const { title, description } = body;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return NextResponse.json({ tags: [] }, { status: 400 });
  }

  const safeTitle = title.slice(0, 200);
  const safeDesc = typeof description === 'string' ? description.slice(0, 500) : '';

  // バックエンドから全タスク取得（完了済み含む）
  const tasksRes = await fetch(`${API_BASE_URL}/tasks`, {
    headers: { 'X-User-ID': userId, 'Content-Type': 'application/json' },
  }).catch(() => null);

  const tasks: TaskFromBackend[] = tasksRes?.ok
    ? ((await tasksRes.json()).tasks ?? [])
    : [];

  // タグの使用頻度を集計
  const tagCounts: Record<string, number> = {};
  tasks.forEach(t => {
    t.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const tagList = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}(${count}回)`)
    .join(', ');

  // 直近20件のタスクで履歴を構築
  const history = tasks
    .filter(t => t.tags?.length > 0)
    .slice(-20)
    .map(t => `「${t.title}」→ ${JSON.stringify(t.tags)}`)
    .join('\n');

  const prompt = `あなたはタスク管理アプリのタグ提案AIです。
利用可能なタグ（使用頻度順）: ${tagList || 'なし'}

過去のタスクとタグ:
${history || '履歴なし'}

新しいタスク:
タイトル: ${safeTitle}
説明: ${safeDesc}

既存タグから優先して2〜3個選んでください。既存タグに合うものが一つもなければ新しいタグを1〜2個提案してください。
JSONの配列のみを返してください。例: ["大学", "数学"]`;

  console.log('=== suggest-tags prompt ===\n' + prompt + '\n===========================');

  // Groq呼び出し
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.2,
    }),
  }).catch(() => null);

  if (!groqRes?.ok) return NextResponse.json({ tags: [] });

  const groqData = await groqRes.json();
  const text: string = groqData.choices?.[0]?.message?.content ?? '';

  try {
    const match = text.match(/\[[\s\S]*?\]/);
    const parsed = JSON.parse(match?.[0] ?? '[]');
    const tags = Array.isArray(parsed)
      ? parsed
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map(t => t.trim())
          .slice(0, 5)
      : [];
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ tags: [] });
  }
}
