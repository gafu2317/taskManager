import { loadTasksFromLocal, saveTasksToLocal } from './localStorage';
import { Task } from '../types/task';

// ゲストデータをユーザーアカウントに移行
export const migrateGuestDataToUser = (userId: string): void => {
  const guestTasks = loadTasksFromLocal();
  
  // ゲストタスクがある場合、ユーザーIDを設定して保存
  if (guestTasks.length > 0) {
    const userTasks = guestTasks.map(task => ({
      ...task,
      userId: userId,
      updatedAt: new Date()
    }));
    
    saveTasksToLocal(userTasks);
    
    console.log(`${guestTasks.length}個のゲストタスクをユーザー ${userId} に移行しました`);
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