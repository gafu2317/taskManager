export interface TaskFilter {
  selectedTags: string[];
  filterMode: 'AND' | 'OR';
  isCollapsed: boolean; // パネルの折りたたみ状態
}