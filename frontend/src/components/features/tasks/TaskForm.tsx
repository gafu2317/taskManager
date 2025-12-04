import React, {useState} from 'react'
import { Task } from '../../../types/task'
import { createTask } from '../../../lib/api'

interface TaskFormProps {
  onTaskCreated: () => void;
}

const TaskForm = ( props:TaskFormProps) => {
  const { onTaskCreated } = props;
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [importance, setImportance] = useState<number|undefined>(undefined);
  const [cost, setCost] = useState<number|undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    // バリデーション(仮)
    if (!importance) {
      alert('Importance is required (1-5)');
      return;
    }
    if (!cost) {
      alert('Cost is required (1-5)');
      return;
    }

    e.preventDefault();
    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      description,
      importance,
      cost,
      tags,
      completed: false,
      userId : ""
    };

    try {
      await createTask(newTask);
      setTitle('');
      setDescription('');
      setImportance(1);
      setCost(1);
      setTags([]);
      onTaskCreated(); // タスク作成後に親コンポーネントに通知
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <>
      <h2 className="text-xl font-bold mb-4">Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Importance(1~5)</label>
          <input
            type="number"
            value={importance === undefined ? '' : importance}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setImportance(undefined);
              } else {
                setImportance(Number(value));
              }
            }}
            className="w-full border px-3 py-2 rounded"
            min={1}
            max={5}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Cost(1~5)</label>
          <input
            type="number"
            value={cost === undefined ? '' : cost}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setCost(undefined);
              } else {
                setCost(Number(value));
              }
            }}
            className="w-full border px-3 py-2 rounded"
            min={1}
            max={5}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Tags (comma separated)</label>
          <input
            type="text"
            value={tags.join(', ')}
            onChange={(e) => 
              setTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0))}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Task
        </button>
      </form>
    </>
  )
}

export default TaskForm
