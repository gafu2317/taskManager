import React from 'react'
import { TaskFilter } from '../../../types/filter';

interface TaskFilterPanelProps {
  taskFilter:TaskFilter,
  availableTags:{name:string, count:number}[],
  onFilterChange:(newFilter: Partial<TaskFilter>) => void
}

const TaskFilterPanel = ({taskFilter, availableTags, onFilterChange}:TaskFilterPanelProps) => {
  return (
    <div className="w-full bg-red-200 border border-red-500 p-4 mb-4">
      <h3 className="font-bold">フィルターパネル</h3>
      <p>テスト表示中</p>
    </div>
  )
}

export default TaskFilterPanel
