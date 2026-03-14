import { Task } from '../types/task';
import { Tag } from '../types/tag';
import { WorkSession } from '../types/session';
import { Habit, HabitRecord, HabitCompletedType } from '../types/habit';
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

// 習慣関連API（LocalStorage版）
const HABITS_KEY = 'guest_habits';
const HABIT_RECORDS_KEY = 'guest_habit_records';

const loadHabitsFromLocal = (): Habit[] => {
  try {
    const data = localStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveHabitsToLocal = (habits: Habit[]): void => {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (error) {
    console.error('Failed to save habits to localStorage:', error);
  }
};

const loadHabitRecordsFromLocal = (): HabitRecord[] => {
  try {
    const data = localStorage.getItem(HABIT_RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveHabitRecordsToLocal = (records: HabitRecord[]): void => {
  try {
    localStorage.setItem(HABIT_RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save habit records to localStorage:', error);
  }
};

export const getHabits = async (): Promise<Habit[]> => {
  return loadHabitsFromLocal();
};

export const createHabit = async (data: Pick<Habit, 'title' | 'miniVersion' | 'fullVersion'>): Promise<Habit> => {
  const habits = loadHabitsFromLocal();
  const newHabit: Habit = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId: 'guest',
    title: data.title,
    miniVersion: data.miniVersion,
    fullVersion: data.fullVersion,
    graduated: false,
    graduatedAt: '',
    peakStreak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  habits.push(newHabit);
  saveHabitsToLocal(habits);
  return newHabit;
};

export const graduateHabit = async (id: string, peakStreak: number): Promise<Habit> => {
  const habits = loadHabitsFromLocal();
  const idx = habits.findIndex(h => h.id === id);
  if (idx < 0) throw new Error('Habit not found');
  habits[idx] = {
    ...habits[idx],
    graduated: true,
    graduatedAt: new Date().toISOString().slice(0, 10),
    peakStreak,
    updatedAt: new Date().toISOString(),
  };
  saveHabitsToLocal(habits);
  return habits[idx];
};

export const deleteHabit = async (id: string): Promise<void> => {
  const habits = loadHabitsFromLocal();
  saveHabitsToLocal(habits.filter(h => h.id !== id));
};

export const upsertHabitRecord = async (habitId: string, date: string, completed: HabitCompletedType): Promise<HabitRecord> => {
  const records = loadHabitRecordsFromLocal();
  const existing = records.findIndex(r => r.habitId === habitId && r.date === date);
  const record: HabitRecord = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    habitId,
    date,
    completed,
    createdAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    records[existing] = record;
  } else {
    records.push(record);
  }
  saveHabitRecordsToLocal(records);
  return record;
};

export const getHabitRecords = async (habitId: string, dateFrom?: string, dateTo?: string): Promise<HabitRecord[]> => {
  const records = loadHabitRecordsFromLocal();
  return records.filter(r => {
    if (r.habitId !== habitId) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
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