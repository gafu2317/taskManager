export type NodeType = 'goal' | 'task';

export type Task = {
  id: string;
  userId: string;
  parentId?: string;
  nodeType?: NodeType;
  title: string;
  description: string;
  completed: boolean;
  importance: number;
  cost: number;
  tags: string[];
  totalWorkTime?: number;
  totalBreakTime?: number;
  createdAt: string;
  updatedAt: string;
}
