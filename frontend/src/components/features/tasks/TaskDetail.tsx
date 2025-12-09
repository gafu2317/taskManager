import React from 'react'
import { Task } from '../../../types/task'

interface TaskDetailProps {
  selectedTask: Task;
}

const TaskDetail = ({selectedTask}: TaskDetailProps) => {
  return (
  <>
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Title</h3>
        <p className="text-gray-600">{selectedTask.title}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
        <p className="text-gray-600">{selectedTask.description || "No description"}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Importance</h3>
        <p className="text-gray-600">{selectedTask.importance}/5</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Cost</h3>
        <p className="text-gray-600">{selectedTask.cost}/5</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
        <p className="text-gray-600">{selectedTask.completed ? "Completed" : "Pending"}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {selectedTask.tags.length > 0 ? (
            selectedTask.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No tags</span>
          )}
        </div>
      </div>
    </div>
  </>
  )
}

export default TaskDetail
