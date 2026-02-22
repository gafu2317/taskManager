import { loadTasksFromLocal, saveTasksToLocal } from './localStorage';
import { createTask as createDynamoTask, createSession as createDynamoSession } from './api.dynamodb';
import { Task } from '../types/task';
import { WorkSession } from '../types/session';

const SESSIONS_KEY = 'guest_sessions';

// LocalStorageからDynamoDBにデータ移行
export const migrateGuestDataToCloud = async (userId: string): Promise<void> => {
  const guestTasks = loadTasksFromLocal();
  
  if (guestTasks.length === 0) {
    console.log('移行するゲストタスクがありません');
    return;
  }

  console.log(`${guestTasks.length}個のゲストタスクをDynamoDBに移行開始...`);
  
  try {
    // LocalStorageのタスクを1つずつDynamoDBに保存
    for (const task of guestTasks) {
      const taskData = {
        title: task.title,
        description: task.description,
        importance: task.importance,
        cost: task.cost,
        tags: task.tags || [],
        completed: task.completed,
        userId: userId
      };
      
      await createDynamoTask(taskData);
    }
    
    // 移行成功後、LocalStorageをクリア
    saveTasksToLocal([]);
    
    console.log(`✅ ${guestTasks.length}個のタスクをDynamoDBに移行完了`);
  } catch (error) {
    console.error('❌ データ移行エラー:', error);
    throw new Error('データ移行に失敗しました');
  }
};

// ユーザーのタスクのみを取得
export const getUserTasks = (userId: string): Task[] => {
  const allTasks = loadTasksFromLocal();
  return allTasks.filter(task => task.userId === userId);
};

// ゲストタスクのみを取得
export const getGuestTasks = (): Task[] => {
  const allTasks = loadTasksFromLocal();
  return allTasks.filter(task => !task.userId);
};

// ゲストセッションをDynamoDBに移行
export const migrateGuestSessionsToCloud = async (): Promise<void> => {
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return;

  let guestSessions: WorkSession[] = [];
  try {
    guestSessions = JSON.parse(raw);
  } catch {
    return;
  }

  if (guestSessions.length === 0) return;

  console.log(`${guestSessions.length}個のゲストセッションをDynamoDBに移行開始...`);

  try {
    for (const session of guestSessions) {
      const { sessionId: _id, ...sessionData } = session;
      await createDynamoSession(sessionData);
    }
    localStorage.removeItem(SESSIONS_KEY);
    console.log(`✅ ${guestSessions.length}個のセッションを移行完了`);
  } catch (error) {
    console.error('❌ セッション移行エラー:', error);
  }
};