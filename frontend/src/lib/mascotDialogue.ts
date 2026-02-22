import { MascotMood } from '../types/mascot';

const dialogues: Record<MascotMood, string[]> = {
  idle: [
    'やること、あった気がするんだけどな…',
    'ちょっと一息ついてもいいかも',
    '今日は何しようか？',
    'タスクを追加してみよう！',
  ],
  happy: [
    'いいね！調子いいじゃん！',
    'タスク管理バッチリ！',
    'その調子でどんどんいこう！',
    'がんばってるね！',
  ],
  cheering: [
    'タスクがたくさん！整理しよう！',
    'もうひと踏ん張り！',
    '絶対できる！',
    '応援してるよ！',
  ],
};

export function getDialogue(mood: MascotMood): string {
  const list = dialogues[mood];
  return list[Math.floor(Math.random() * list.length)];
}

export function getMood(taskCount: number): MascotMood {
  if (taskCount >= 5) return 'cheering';
  if (taskCount > 0) return 'happy';
  return 'idle';
}
