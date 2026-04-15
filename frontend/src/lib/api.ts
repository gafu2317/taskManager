import { Task } from '../types/task';
import * as dynamoApi from './api.dynamodb';

export async function getTasks(options: { completed?: boolean } = {}): Promise<Task[]> {
  return dynamoApi.getTasks(options);
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  return dynamoApi.createTask(task);
}

export async function getTask(id: string): Promise<Task> {
  return dynamoApi.getTask(id);
}

export async function updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
  return dynamoApi.updateTask(id, taskData);
}

export async function deleteTask(id: string): Promise<void> {
  return dynamoApi.deleteTask(id);
}
