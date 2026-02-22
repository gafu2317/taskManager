import { Task } from '../types/task';
import { WorkSession } from '../types/session';
import { BGMPreset } from '../types/bgmPreset';
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
    const data: { tags: Array<{ name: string; count: number }>; count: number } = await response.json();
    return (data.tags ?? []).map(tag => tag.name);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
}

// バックエンドのsnake_caseレスポンスをcamelCaseに変換
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWorkSession(s: any): WorkSession {
  return {
    sessionId: s.session_id ?? s.sessionId ?? '',
    taskId: s.task_id ?? s.taskId ?? '',
    taskTitle: s.task_title ?? s.taskTitle ?? '',
    date: s.date ?? '',
    workTime: s.work_time ?? s.workTime ?? 0,
    breakTime: s.break_time ?? s.breakTime ?? 0,
    startedAt: s.started_at ?? s.startedAt ?? '',
    endedAt: s.ended_at ?? s.endedAt ?? '',
  };
}

// セッションAPI
export async function createSession(session: Omit<WorkSession, 'sessionId'>): Promise<WorkSession> {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        task_id: session.taskId,
        task_title: session.taskTitle,
        date: session.date,
        work_time: session.workTime,
        break_time: session.breakTime,
        started_at: session.startedAt,
        ended_at: session.endedAt,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    return toWorkSession(await response.json());
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSessions(dateFrom?: string, dateTo?: string): Promise<WorkSession[]> {
  try {
    let url = `${API_BASE_URL}/sessions`;
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }
    const data: { sessions: unknown[]; count: number } = await response.json();
    return (data.sessions ?? []).map(toWorkSession);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }
}

// BGMプリセットAPI
export async function getBGMPresets(): Promise<BGMPreset[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/bgm-presets`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch BGM presets');
    const data: { presets: BGMPreset[] } = await response.json();
    return data.presets ?? [];
  } catch (error) {
    console.error('Error fetching BGM presets:', error);
    throw error;
  }
}

export async function createBGMPreset(label: string, videoId: string): Promise<BGMPreset> {
  try {
    const response = await fetch(`${API_BASE_URL}/bgm-presets`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ label, video_id: videoId }),
    });
    if (!response.ok) throw new Error('Failed to create BGM preset');
    return await response.json();
  } catch (error) {
    console.error('Error creating BGM preset:', error);
    throw error;
  }
}

export async function deleteBGMPreset(presetId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/bgm-preset/${presetId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete BGM preset');
  } catch (error) {
    console.error('Error deleting BGM preset:', error);
    throw error;
  }
}