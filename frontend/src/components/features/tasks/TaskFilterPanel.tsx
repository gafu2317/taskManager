import React from 'react'
import { TaskFilter } from '../../../types/filter';

interface TaskFilterPanelProps {
  taskFilter:TaskFilter,
  availableTags:{name:string, count:number}[],
  onFilterChange:(newFilter: Partial<TaskFilter>) => void
}

const TaskFilterPanel = ({taskFilter, availableTags, onFilterChange}:TaskFilterPanelProps) => {
  
  const handleTagToggle = (tagName: string) => {
    const newSelectedTags = taskFilter.selectedTags.includes(tagName)
      ? taskFilter.selectedTags.filter(tag => tag !== tagName)
      : [...taskFilter.selectedTags, tagName];
    
    onFilterChange({ selectedTags: newSelectedTags });
  };

  const handleModeChange = (mode: 'AND' | 'OR') => {
    onFilterChange({ filterMode: mode });
  };

  const handleToggleCollapse = () => {
    onFilterChange({ isCollapsed: !taskFilter.isCollapsed });
  };

  const clearFilter = () => {
    onFilterChange({ selectedTags: [] });
  };

  // 使用量でソート（多い順）
  const sortedTags = [...availableTags].sort((a, b) => b.count - a.count);

  return (
    <div className="w-full bg-white border border-aqua/20 p-4 mb-4 rounded-lg">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            フィルター: {taskFilter.selectedTags.length}個選択中
          </span>
          {taskFilter.selectedTags.length > 0 && (
            <button
              onClick={clearFilter}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
            >
              クリア
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={taskFilter.filterMode}
            onChange={(e) => handleModeChange(e.target.value as 'AND' | 'OR')}
            className="text-xs border border-mist rounded px-2 py-1 bg-white text-ink"
          >
            <option value="AND">すべて含む (AND)</option>
            <option value="OR">いずれか含む (OR)</option>
          </select>
          <button
            onClick={handleToggleCollapse}
            className="text-xs bg-mist/50 border border-mist px-2 py-1 rounded hover:bg-mist text-ink"
          >
            {taskFilter.isCollapsed ? 'タグの展開' : 'タグを折りたたむ'}
          </button>
        </div>
      </div>

      {/* タグ一覧 */}
      <div className={`${taskFilter.isCollapsed ? 'max-h-16 overflow-hidden' : 'max-h-none'} transition-all`}>
        <div className="flex flex-wrap gap-1">
          {sortedTags.map(tag => (
            <label
              key={tag.name}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-mist rounded text-xs cursor-pointer hover:border-aqua hover:text-aqua text-ink"
            >
              <input
                type="checkbox"
                checked={taskFilter.selectedTags.includes(tag.name)}
                onChange={() => handleTagToggle(tag.name)}
                className="text-xs"
              />
              <span>{tag.name} ({tag.count})</span>
            </label>
          ))}
        </div>
        {sortedTags.length === 0 && (
          <p className="text-ink/40 text-xs">タグが見つかりません</p>
        )}
      </div>

    </div>
  )
}

export default TaskFilterPanel
