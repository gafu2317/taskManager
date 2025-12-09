import React, {useState} from 'react'
import { Task } from '../../../types/task'
import { createTask } from '../../../lib/api'
import { getCostColor, getCostButtonSize } from '../../../utils/taskUtils'

interface TaskFormProps {
  onTaskCreated: () => void;
}

const TaskForm = ( props:TaskFormProps) => {
  const { onTaskCreated } = props;
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [importance, setImportance] = useState<number>(1);
  const [cost, setCost] = useState<number>(1);
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
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
      <h2 className="text-xl font-bold mb-4">新しいタスクを作成</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">タイトル</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">重要度</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setImportance(level)}
                className={`w-10 h-10 rounded-full font-semibold transition-all text-black ${
                  importance === level
                    ? 'border-3 border-gray-600 shadow-md transform scale-105'
                    : 'border-2 border-gray-300 hover:border-gray-400 hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: getCostColor(level)
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-2 font-medium">コスト</label>
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4, 5].map((level) => {
              const sizeClass = getCostButtonSize(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCost(level)}
                  className={`${sizeClass} rounded-full font-semibold transition-all text-black ${
                    cost === level
                      ? 'bg-gray-300 border-3 border-gray-600 shadow-md transform scale-105'
                      : 'bg-white border-2 border-gray-400 hover:border-gray-500 hover:shadow-sm'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">タグ（カンマ区切り）</label>
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
          タスクを作成
        </button>
      </form>
    </>
  )
}

export default TaskForm
