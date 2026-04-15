import { Task } from '../types/task';
import { WorkSession } from '../types/session';
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (session?.user && (session.user as { id?: string }).id) {
    headers['X-User-ID'] = (session.user as { id: string }).id;
  } else {
    throw new Error('User not authenticated');
  }
  return headers;
}

// snake_case → camelCase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTask(t: any): Task {
  return {
    id:             t.id ?? '',
    userId:         t.user_id ?? t.userId ?? '',
    parentId:       t.parent_id ?? t.parentId ?? '',
    nodeType:       t.node_type ?? t.nodeType ?? 'task',
    title:          t.title ?? '',
    description:    t.description ?? '',
    completed:      t.completed ?? false,
    importance:     t.importance ?? 0,
    cost:           t.cost ?? 0,
    tags:           t.tags ?? [],
    totalWorkTime:  t.total_work_time ?? t.totalWorkTime ?? 0,
    totalBreakTime: t.total_break_time ?? t.totalBreakTime ?? 0,
    createdAt:      t.created_at ?? t.createdAt ?? '',
    updatedAt:      t.updated_at ?? t.updatedAt ?? '',
  };
}

// camelCase → snake_case
function toBackendTask(task: Partial<Task>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: Record<string, unknown> = { ...(task as any) };
  if ('parentId'       in task) { r['parent_id']       = task.parentId;      delete r['parentId']; }
  if ('nodeType'       in task) { r['node_type']        = task.nodeType;       delete r['nodeType']; }
  if ('userId'         in task) { r['user_id']          = task.userId;         delete r['userId']; }
  if ('totalWorkTime'  in task) { r['total_work_time']  = task.totalWorkTime;  delete r['totalWorkTime']; }
  if ('totalBreakTime' in task) { r['total_break_time'] = task.totalBreakTime; delete r['totalBreakTime']; }
  if ('createdAt'      in task) { r['created_at']       = task.createdAt;      delete r['createdAt']; }
  if ('updatedAt'      in task) { r['updated_at']       = task.updatedAt;      delete r['updatedAt']; }
  return r;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWorkSession(s: any): WorkSession {
  return {
    sessionId:  s.session_id  ?? s.sessionId  ?? '',
    taskId:     s.task_id     ?? s.taskId     ?? '',
    taskTitle:  s.task_title  ?? s.taskTitle  ?? '',
    date:       s.date        ?? '',
    workTime:   s.work_time   ?? s.workTime   ?? 0,
    breakTime:  s.break_time  ?? s.breakTime  ?? 0,
    startedAt:  s.started_at  ?? s.startedAt  ?? '',
    endedAt:    s.ended_at    ?? s.endedAt    ?? '',
  };
}

export async function getTasks(options: { completed?: boolean } = {}): Promise<Task[]> {
  let url = `${API_BASE_URL}/tasks`;
  if (options.completed !== undefined) url += `?completed=${options.completed}`;
  const res = await fetch(url, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data: { tasks: unknown[]; count: number } = await res.json();
  return (data.tasks || []).map(toTask);
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const res = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(toBackendTask(task)),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return toTask(await res.json());
}

export async function getTask(id: string): Promise<Task> {
  const res = await fetch(`${API_BASE_URL}/task/${id}`, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch task');
  return toTask(await res.json());
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task> {
  const res = await fetch(`${API_BASE_URL}/task/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(toBackendTask(task)),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return toTask(await res.json());
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/task/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

export async function getTags(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/tags`, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch tags');
  const data: { tags: Array<{ name: string; count: number }> } = await res.json();
  return (data.tags ?? []).map(t => t.name);
}

export async function createSession(session: Omit<WorkSession, 'sessionId'>): Promise<WorkSession> {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      task_id:    session.taskId,
      task_title: session.taskTitle,
      date:       session.date,
      work_time:  session.workTime,
      break_time: session.breakTime,
      started_at: session.startedAt,
      ended_at:   session.endedAt,
    }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return toWorkSession(await res.json());
}

export async function getSessions(dateFrom?: string, dateTo?: string): Promise<WorkSession[]> {
  let url = `${API_BASE_URL}/sessions`;
  const params = new URLSearchParams();
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo)   params.set('date_to', dateTo);
  if (params.toString()) url += `?${params.toString()}`;
  const res = await fetch(url, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch sessions');
  const data: { sessions: unknown[] } = await res.json();
  return (data.sessions ?? []).map(toWorkSession);
}
