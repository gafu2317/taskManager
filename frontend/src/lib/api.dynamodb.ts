import { Task } from '../types/task';
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

    createdAt:      t.created_at ?? t.createdAt ?? '',
    updatedAt:      t.updated_at ?? t.updatedAt ?? '',
  };
}

function toBackendTask(task: Partial<Task>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r: Record<string, unknown> = { ...(task as any) };
  if ('parentId'  in task) { r['parent_id'] = task.parentId;  delete r['parentId']; }
  if ('nodeType'  in task) { r['node_type'] = task.nodeType;  delete r['nodeType']; }
  if ('userId'    in task) { r['user_id']   = task.userId;    delete r['userId']; }
  if ('createdAt' in task) { r['created_at'] = task.createdAt; delete r['createdAt']; }
  if ('updatedAt' in task) { r['updated_at'] = task.updatedAt; delete r['updatedAt']; }
  return r;
}

export async function getTasks(options: { completed?: boolean } = {}): Promise<Task[]> {
  let url = `${API_BASE_URL}/tasks`;
  if (options.completed !== undefined) url += `?completed=${options.completed}`;
  const res = await fetch(url, { headers: await getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  const data: { tasks: unknown[] } = await res.json();
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
