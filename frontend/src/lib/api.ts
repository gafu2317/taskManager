import { Task } from '../types/task';

const API_BASE_URL = 'http://localhost:8080';

interface TasksResponse {
    tasks: Task[];
    count: number;
  }

interface GetTasksOptions {
  completed?: boolean;
}

export async function getTasks(options: GetTasksOptions = {}): Promise<Task[]> {
  try {
    let url = `${API_BASE_URL}/tasks`;
    if (options.completed !== undefined) {
      url += `?completed=${options.completed}`;
    }
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    const data: TasksResponse = await response.json();
    return data.tasks;

  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/task/${id}`);

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
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  } 
}