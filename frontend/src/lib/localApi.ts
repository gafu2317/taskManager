import { Task } from '../types/task';
import { Tag } from '../types/tag';
import { WorkSession } from '../types/session';
import { saveTasksToLocal, loadTasksFromLocal, saveTagsToLocal, loadTagsFromLocal } from './localStorage';

const SESSIONS_KEY = 'guest_sessions';

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

// 統一API名
export const getTasks = async (options: { completed?: boolean } = {}): Promise<Task[]> => {
  return getTasksLocal(options);
};

export const createTaskLocal = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const tasks = loadTasksFromLocal();
  const tags = loadTagsFromLocal();
  
  const newTask: Task = {
    ...taskData,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // タスクを保存
  tasks.push(newTask);
  saveTasksToLocal(tasks);
  
  // タグ管理
  updateTagsLocal(newTask.tags, tags);
  
  return newTask;
};

// 統一API名
export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  return createTaskLocal(taskData);
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
    updatedAt: new Date().toISOString(),
  };
  
  tasks[taskIndex] = updatedTask;
  saveTasksToLocal(tasks);
  
  return updatedTask;
};

// 統一API名
export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  return updateTaskLocal(id, updates);
};

export const deleteTaskLocal = async (id: string): Promise<void> => {
  const tasks = loadTasksFromLocal();
  const filteredTasks = tasks.filter(task => task.id !== id);
  
  if (tasks.length === filteredTasks.length) {
    throw new Error('Task not found');
  }
  
  saveTasksToLocal(filteredTasks);
};

// 統一API名
export const deleteTask = async (id: string): Promise<void> => {
  return deleteTaskLocal(id);
};

export const getTaskLocal = async (id: string): Promise<Task> => {
  const tasks = loadTasksFromLocal();
  const task = tasks.find(task => task.id === id);
  
  if (!task) {
    throw new Error('Task not found');
  }
  
  return task;
};

// 統一API名
export const getTask = async (id: string): Promise<Task> => {
  return getTaskLocal(id);
};

// タグ関連API（LocalStorage版）
export const getTagsLocal = async (): Promise<Tag[]> => {
  return loadTagsFromLocal();
};

// getTags API統一のため（string[]を返す版）
export const getTags = async (): Promise<string[]> => {
  const tags = loadTagsFromLocal();
  return tags.map(tag => tag.name);
};

// セッション関連API（LocalStorage版）
const loadSessionsFromLocal = (): WorkSession[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSessionsToLocal = (sessions: WorkSession[]): void => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to localStorage:', error);
  }
};

export const createSession = async (session: Omit<WorkSession, 'sessionId'>): Promise<WorkSession> => {
  const sessions = loadSessionsFromLocal();
  const newSession: WorkSession = {
    ...session,
    sessionId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };
  sessions.push(newSession);
  saveSessionsToLocal(sessions);
  return newSession;
};

export const getSessions = async (dateFrom?: string, dateTo?: string): Promise<WorkSession[]> => {
  const sessions = loadSessionsFromLocal();
  return sessions.filter(s => {
    if (dateFrom && s.date < dateFrom) return false;
    if (dateTo && s.date > dateTo) return false;
    return true;
  });
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