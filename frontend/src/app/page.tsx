'use client';

import { useState, useEffect} from "react";
import { Task } from "../types/task";
import { getTasks } from "../lib/api";
import TaskForm from "@/components/features/tasks/TaskForm";

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
      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks available.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} className="mb-2 p-2 border rounded">
              <h2 className="text-xl font-semibold">{task.title}</h2>
              <p>{task.description}</p>
              <p>
                <strong>Completed:</strong> {task.completed ? "Yes" : "No"}
              </p>
              <p>
                <strong>Importance:</strong> {task.importance}
              </p>
              <p>
                <strong>Cost:</strong> ${task.cost}
              </p>
              <p>
                <strong>Tags:</strong> {task.tags.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}    
    </>
  );
}
