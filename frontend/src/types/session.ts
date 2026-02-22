export type WorkSession = {
  sessionId: string;
  taskId: string;
  taskTitle: string;
  date: string;      // YYYY-MM-DD
  workTime: number;  // 秒
  breakTime: number; // 秒
  startedAt: string;
  endedAt: string;
};
