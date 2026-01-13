import { Task } from '../types/task';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface TasksResponse {
    tasks: Task[];
    count: number;
}

interface GetTasksOptions {
  completed?: boolean;
}

// 認証ヘッダーを取得
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (session?.user && (session.user as { id?: string }).id) {
    headers['X-User-ID'] = (session.user as { id: string }).id;
    console.log('Sending X-User-ID header:', (session.user as { id: string }).id);
  } else {
    throw new Error('User not authenticated');
  }
  
  return headers;
}

export async function getTasks(options: GetTasksOptions = {}): Promise<Task[]> {
  try {
    let url = `${API_BASE_URL}/tasks`;
    if (options.completed !== undefined) {
      url += `?completed=${options.completed}`;
    }
    
    const response = await fetch(url, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    const data: TasksResponse = await response.json();
    return data.tasks || [];

  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    const createdTask: Task = await response.json();
    return createdTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function getTask(id: string): Promise<Task> {
  try {
    const response = await fetch(`${API_BASE_URL}/task/${id}`, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    const task: Task = await response.json();
    return task;

  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task> {
  try {
    const response = await fetch(`${API_BASE_URL}/task/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    const updatedTask: Task = await response.json();
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/task/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  } 
}

// タグAPI
export async function getTags(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    const tags: string[] = await response.json();
    return tags;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}