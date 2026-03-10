import React from 'react'
import { Task } from '../../../types/task'

interface TaskDetailProps {
  selectedTask: Task;
  onTaskDelete: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onSplitTab?: () => void;
}

const TaskDetail = ({selectedTask, onTaskDelete, onTaskEdit, onTaskComplete, onSplitTab}: TaskDetailProps) => {
  return (
  <>
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-gray-600 text-sm mb-1">タイトル</h3>
        <p className="text-gray-800 text-sm">{selectedTask.title}</p>
      </div>
      
      <div>
        <h3 className="font-medium text-gray-600 text-sm mb-1">説明</h3>
        <p className="text-gray-800 text-sm break-all">{selectedTask.description || "説明なし"}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-gray-500">重要度: </span>
          <span className="text-sm font-medium">{selectedTask.importance}/5</span>
        </div>
        <div>
          <span className="text-xs text-gray-500">コスト: </span>
          <span className="text-sm font-medium">{selectedTask.cost}/5</span>
        </div>
      </div>
      
      <div>
        <span className="text-xs text-gray-500">ステータス: </span>
        <span className="text-sm font-medium">{selectedTask.completed ? "完了" : "未完了"}</span>
      </div>
      
      <div>
        <h3 className="font-medium text-gray-600 text-sm mb-1">タグ</h3>
        <div className="flex flex-wrap gap-1">
          {selectedTask.tags.length > 0 ? (
            selectedTask.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-xs">タグなし</span>
          )}
        </div>
      </div>
      
      {/* 操作ボタン */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2 flex-wrap">
        <button
          onClick={() => onTaskComplete(selectedTask.id)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-md transition-colors text-xs"
        >
          完了
        </button>
        <button
          onClick={() => onTaskEdit(selectedTask)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md transition-colors text-xs"
        >
          編集
        </button>
        <button
          onClick={() => onTaskDelete(selectedTask.id)}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 rounded-md transition-colors text-xs"
        >
          削除
        </button>
        {onSplitTab && (
          <button
            onClick={onSplitTab}
            className="w-full border border-aqua text-aqua hover:bg-aqua hover:text-white text-sm px-3 py-1.5 transition-colors"
          >
            ✂️ AIで分割する
          </button>
        )}
      </div>
    </div>
  </>
  )
}

export default TaskDetail
