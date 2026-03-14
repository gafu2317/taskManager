export type Habit = {
  id: string;
  userId: string;
  title: string;
  miniVersion: string;
  fullVersion: string;
  graduated: boolean;
  graduatedAt: string;
  peakStreak: number;
  createdAt: string;
  updatedAt: string;
};

export type HabitCompletedType = 'mini' | 'full';

export type HabitRecord = {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: HabitCompletedType;
  createdAt: string;
};
