import { Task } from '../types/task';
import { Tag } from '../types/tag';
import { saveTasksToLocal, loadTasksFromLocal, saveTagsToLocal, loadTagsFromLocal } from './localStorage';

// UUIDの簡易生成
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// タスク関連API（LocalStorage版）
export const getTasksLocal = async (options: { completed?: boolean } = {}): Promise<Task[]> => {
  const tasks = loadTasksFromLocal();
  
  if (options.completed === undefined) {
    return tasks;
  }
  
  return tasks.filter(task => task.completed === options.completed);
};

export const createTaskLocal = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const tasks = loadTasksFromLocal();
  const tags = loadTagsFromLocal();
  
  const newTask: Task = {
    ...taskData,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // タスクを保存
  tasks.push(newTask);
  saveTasksToLocal(tasks);
  
  // タグ管理
  updateTagsLocal(newTask.tags, tags);
  
  return newTask;
};

export const updateTaskLocal = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const tasks = loadTasksFromLocal();
  const taskIndex = tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    throw new Error('Task not found');
  }
  
  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date(),
  };
  
  tasks[taskIndex] = updatedTask;
  saveTasksToLocal(tasks);
  
  return updatedTask;
};

export const deleteTaskLocal = async (id: string): Promise<void> => {
  const tasks = loadTasksFromLocal();
  const filteredTasks = tasks.filter(task => task.id !== id);
  
  if (tasks.length === filteredTasks.length) {
    throw new Error('Task not found');
  }
  
  saveTasksToLocal(filteredTasks);
};

export const getTaskLocal = async (id: string): Promise<Task> => {
  const tasks = loadTasksFromLocal();
  const task = tasks.find(task => task.id === id);
  
  if (!task) {
    throw new Error('Task not found');
  }
  
  return task;
};

// タグ関連API（LocalStorage版）
export const getTagsLocal = async (): Promise<Tag[]> => {
  return loadTagsFromLocal();
};

// タグの更新処理（内部関数）
const updateTagsLocal = (taskTags: string[], existingTags: Tag[]): void => {
  const tagMap = new Map<string, Tag>();
  
  // 既存タグをマップに変換
  existingTags.forEach(tag => {
    tagMap.set(tag.name, tag);
  });
  
  // タスクのタグを処理
  taskTags.forEach(tagName => {
    if (tagMap.has(tagName)) {
      const tag = tagMap.get(tagName)!;
      tag.count += 1;
      tag.last_used = new Date().toISOString();
    } else {
      tagMap.set(tagName, {
        id: tagName,
        name: tagName,
        count: 1,
        last_used: new Date().toISOString(),
      });
    }
  });
  
  // 更新されたタグを保存
  const updatedTags = Array.from(tagMap.values());
  saveTagsToLocal(updatedTags);
};