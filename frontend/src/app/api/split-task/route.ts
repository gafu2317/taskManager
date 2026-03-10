import { NextRequest, NextResponse } from 'next/server';

interface SubTaskDraft {
  title: string;
  description: string;
  importance: number;
  cost: number;
  tags: string[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, tags } = body;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return NextResponse.json({ subtasks: [] }, { status: 400 });
  }

  const safeTitle = title.slice(0, 200);
  const safeDesc = typeof description === 'string' ? description.slice(0, 500) : '';
  const safeTags = Array.isArray(tags) ? tags.slice(0, 10) : [];

  const prompt = `あなたはタスク管理アプリのタスク分割AIです。
以下の大きなタスクを、具体的に実行できる3〜5個のサブタスクに分割してください。

元タスク:
タイトル: ${safeTitle}
説明: ${safeDesc}

ルール:
- タイトルは「〜する」という動詞で終わる具体的なアクション（30文字以内）
- 説明は1文で（100文字以内）
- importanceは1〜5（全部同じ値にしない）
- costは1〜5（作業量を推定）
- tagsは元タスクのタグを引き継ぐ: ${JSON.stringify(safeTags)}

以下のJSON形式のみ返してください:
{"subtasks":[{"title":"...","description":"...","importance":3,"cost":2,"tags":["..."]}]}`;

  console.log('=== split-task prompt ===\n' + prompt + '\n========================');

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.3,
    }),
  }).catch(() => null);

  if (!groqRes?.ok) return NextResponse.json({ subtasks: [] });

  const groqData = await groqRes.json();
  const text: string = groqData.choices?.[0]?.message?.content ?? '';

  try {
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? '{}');
    const subtasks: SubTaskDraft[] = Array.isArray(parsed.subtasks)
      ? parsed.subtasks
          .filter((s: unknown): s is SubTaskDraft =>
            typeof s === 'object' && s !== null &&
            typeof (s as SubTaskDraft).title === 'string' &&
            (s as SubTaskDraft).title.trim().length > 0
          )
          .map((s: SubTaskDraft) => ({
            title: String(s.title).slice(0, 50),
            description: String(s.description ?? '').slice(0, 200),
            importance: Math.min(5, Math.max(1, Number(s.importance) || 3)),
            cost: Math.min(5, Math.max(1, Number(s.cost) || 2)),
            tags: Array.isArray(s.tags) ? s.tags.filter((t): t is string => typeof t === 'string') : [],
          }))
          .slice(0, 5)
      : [];
    return NextResponse.json({ subtasks });
  } catch {
    return NextResponse.json({ subtasks: [] });
  }
}
