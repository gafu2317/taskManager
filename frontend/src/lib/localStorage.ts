import { Task } from '../types/task';
import { Tag } from '../types/tag';

// LocalStorageのキー
const TASKS_KEY = 'taskManager_tasks';
const TAGS_KEY = 'taskManager_tags';

// タスク管理
export const saveTasksToLocal = (tasks: Task[]): void => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
};

export const loadTasksFromLocal = (): Task[] => {
  try {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    return [];
  }
};

// タグ管理
export const saveTagsToLocal = (tags: Tag[]): void => {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch (error) {
    console.error('Failed to save tags to localStorage:', error);
  }
};

export const loadTagsFromLocal = (): Tag[] => {
  try {
    const data = localStorage.getItem(TAGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load tags from localStorage:', error);
    return [];
  }
};

// データクリア（開発用）
export const clearLocalData = (): void => {
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(TAGS_KEY);
};