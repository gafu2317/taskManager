import { useMemo, useState } from "react";
import { Task } from "../types/task";
import { TaskFilter } from "../types/filter";

export const useTaskFilter = (tasks: Task[]) => {
  
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({
    selectedTags: [],
    filterMode: 'AND',
    isCollapsed: false
  });
  
  const availableTags = useMemo(() =>{
    const tagCounts = new Map<string, number>();

    tasks.forEach((task) => {
      if(!task.completed){
        task.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCounts.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (taskFilter.selectedTags.length === 0) {
      return tasks;
    }
  
    return tasks.filter((task) => {
      if (taskFilter.filterMode === 'AND') {
        return taskFilter.selectedTags.every((tagId: string) => task.tags.includes(tagId));
      } else {
        return taskFilter.selectedTags.some((tagId: string) => task.tags.includes(tagId));
      }
    });
  },[tasks, taskFilter]);
  
  const handleFilterChange = (newFilter: Partial<TaskFilter>) => {
    setTaskFilter((prev: TaskFilter) => ({
      ...prev,
      ...newFilter
    }));
  };
  
  return {
    filteredTasks,
    taskFilter,
    handleFilterChange,
    availableTags
  };
}