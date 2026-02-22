import { getSession } from 'next-auth/react';

// LocalStorage版のAPI
import * as localApi from './localApi';

// DynamoDB版のAPI
import * as dynamoApi from './api.dynamodb';

import { Task } from '../types/task';
import { WorkSession } from '../types/session';
import { BGMPreset } from '../types/bgmPreset';

interface GetTasksOptions {
  completed?: boolean;
}

// 認証状態に応じてAPIを切り替え
async function getApiProvider() {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  
  if (isLoggedIn) {
    console.log('Using DynamoDB API (logged in)');
    return dynamoApi;
  } else {
    console.log('Using LocalStorage API (guest)');
    return localApi;
  }
}

// 統一APIインターフェース
export async function getTasks(options: GetTasksOptions = {}): Promise<Task[]> {
  const api = await getApiProvider();
  return api.getTasks(options);
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const api = await getApiProvider();
  return api.createTask(task);
}

export async function getTask(id: string): Promise<Task> {
  const api = await getApiProvider();
  return api.getTask(id);
}

export async function updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
  const api = await getApiProvider();
  return api.updateTask(id, taskData);
}

export async function deleteTask(id: string): Promise<void> {
  const api = await getApiProvider();
  return api.deleteTask(id);
}

export async function getTags(): Promise<string[]> {
  const api = await getApiProvider();
  return api.getTags();
}

export async function createSession(session: Omit<WorkSession, 'sessionId'>): Promise<WorkSession> {
  const api = await getApiProvider();
  return api.createSession(session);
}

export async function getSessions(dateFrom?: string, dateTo?: string): Promise<WorkSession[]> {
  const api = await getApiProvider();
  return api.getSessions(dateFrom, dateTo);
}

// BGMプリセット（サーバー保存のみ、ゲストは空）
export async function getBGMPresets(): Promise<BGMPreset[]> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return [];
  return dynamoApi.getBGMPresets();
}

export async function createBGMPreset(label: string, videoId: string): Promise<BGMPreset | null> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return null;
  return dynamoApi.createBGMPreset(label, videoId);
}

export async function deleteBGMPreset(presetId: string): Promise<void> {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as { id?: string }).id);
  if (!isLoggedIn) return;
  return dynamoApi.deleteBGMPreset(presetId);
}