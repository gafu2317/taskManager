import { getSession } from 'next-auth/react';

// LocalStorage版のAPI
import * as localApi from './localApi';

// DynamoDB版のAPI
import * as dynamoApi from './api.dynamodb';

import { Task } from '../types/task';

interface GetTasksOptions {
  completed?: boolean;
}

// 認証状態に応じてAPIを切り替え
async function getApiProvider() {
  const session = await getSession();
  const isLoggedIn = !!(session?.user && (session.user as any).id);
  
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