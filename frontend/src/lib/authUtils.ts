import { loadTasksFromLocal, saveTasksToLocal } from './localStorage';
import { createTask as createDynamoTask } from './api.dynamodb';
import { Task } from '../types/task';

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