'use client';

import { useState, useEffect} from "react";
import { Task } from "../types/task";
import { getTasks } from "../lib/api";
import TaskForm from "@/components/features/tasks/TaskForm";
import TaskBubbleView from "@/components/features/tasks/TaskBubbleView";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleTaskCreated = async () => {
    setLoading(true);
    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Task List</h1>
      <TaskForm onTaskCreated={handleTaskCreated} />
      <TaskBubbleView tasks={tasks} loading={loading} />
    </>
  );
}
