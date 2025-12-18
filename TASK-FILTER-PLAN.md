# タスクフィルター機能 - 設計書・テスト計画

## 📋 機能要求仕様

### 1. タグフィルター機能
- **FR-001**: 現在のタスクで使用されているタグ一覧を表示
- **FR-002**: タグ使用量の多い順でソート表示  
- **FR-003**: 複数タグ選択によるフィルタリング
- **FR-004**: AND/OR条件の切り替え
- **FR-005**: 2行を超える場合の折りたたみ表示
- **FR-006**: フィルター状態のクリア機能

### 2. 非機能要求
- **NFR-001**: レスポンシブデザイン対応
- **NFR-002**: アクセシビリティ対応（キーボード操作）
- **NFR-003**: 1000個のタスクでも快適な動作

## 🏗️ 技術設計

### A) コンポーネント構成
```
TaskFilterPanel.tsx
├── TaskFilterHeader (AND/OR切り替え + 展開/折りたたみ)
├── TaskFilterTagList (チェックボックス付きタグ一覧)
└── TaskFilterActions (クリア/適用ボタン)
```

### B) 型定義
```typescript
// types/filter.ts
export interface TaskFilter {
  selectedTags: string[];
  filterMode: 'AND' | 'OR';
  isCollapsed: boolean;
}

export interface TagWithCount {
  name: string;
  count: number;
  lastUsed: Date;
}
```

### C) 状態管理
```typescript
// page.tsx の状態
const [taskFilter, setTaskFilter] = useState<TaskFilter>({
  selectedTags: [],
  filterMode: 'AND',
  isCollapsed: false
});
const [availableTags, setAvailableTags] = useState<TagWithCount[]>([]);
```

### D) データ処理フロー
```typescript
// 1. タグ一覧を取得・ソート（使用量順）
const fetchAndSortTags = async () => {
  const tags = await fetchTags();
  const sortedTags = tags
    .filter(tag => tag.count > 0) // 使用中のタグのみ
    .sort((a, b) => b.count - a.count); // 使用量多い順
  setAvailableTags(sortedTags);
};

// 2. タスクフィルタリング処理
const filterTasks = (tasks: Task[], filter: TaskFilter) => {
  if (filter.selectedTags.length === 0) return tasks;
  
  return tasks.filter(task => {
    if (filter.filterMode === 'AND') {
      return filter.selectedTags.every(tag => task.tags.includes(tag));
    } else { // OR
      return filter.selectedTags.some(tag => task.tags.includes(tag));
    }
  });
};
```

### E) UI仕様
```tsx
<div className="task-filter-panel">
  {/* ヘッダー部分 */}
  <div className="filter-header">
    <span>フィルター: {selectedTags.length}個選択中</span>
    <div className="filter-controls">
      <select value={filterMode} onChange={onModeChange}>
        <option value="AND">すべて含む (AND)</option>
        <option value="OR">いずれか含む (OR)</option>
      </select>
      <button onClick={toggleCollapse}>
        {isCollapsed ? '展開' : '折りたたむ'}
      </button>
    </div>
  </div>
  
  {/* タグ一覧（折りたたみ可能） */}
  <div className={`filter-tags ${isCollapsed ? 'collapsed' : 'expanded'}`}>
    {availableTags.map(tag => (
      <label key={tag.name} className="tag-checkbox">
        <input 
          type="checkbox"
          checked={selectedTags.includes(tag.name)}
          onChange={() => onTagToggle(tag.name)}
        />
        <span className="tag-label">
          {tag.name} ({tag.count})
        </span>
      </label>
    ))}
  </div>
  
  {/* アクション */}
  <div className="filter-actions">
    <button onClick={clearFilter}>クリア</button>
  </div>
</div>
```

### F) CSS設計（折りたたみ対応）
```css
.filter-tags.collapsed {
  max-height: 60px; /* 2行分程度 */
  overflow: hidden;
}

.filter-tags.expanded {
  max-height: none;
}

.tag-checkbox {
  display: inline-flex;
  align-items: center;
  margin: 4px 8px 4px 0;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

## 🧪 テスト計画

### A) 単体テスト (Jest + React Testing Library)

```typescript
// __tests__/components/TaskFilterPanel.test.tsx

describe('TaskFilterPanel', () => {
  const mockTags: TagWithCount[] = [
    { name: 'urgent', count: 5, lastUsed: new Date() },
    { name: 'work', count: 3, lastUsed: new Date() },
    { name: 'personal', count: 1, lastUsed: new Date() }
  ];

  // 基本表示テスト
  test('should display tags sorted by count', () => {
    // タグが使用量順に表示されることを確認
  });

  // フィルター選択テスト
  test('should toggle tag selection on checkbox click', () => {
    // チェックボックスクリックで選択状態が変わることを確認
  });

  // AND/OR切り替えテスト
  test('should switch between AND/OR filter modes', () => {
    // セレクトボックスで条件切り替えが動作することを確認
  });

  // 折りたたみテスト
  test('should collapse/expand tag list', () => {
    // 折りたたみボタンでUI表示が変わることを確認
  });

  // クリア機能テスト
  test('should clear all selected tags', () => {
    // クリアボタンで全選択が解除されることを確認
  });
});
```

### B) フィルタリングロジックテスト

```typescript
// __tests__/utils/taskFilter.test.ts

describe('taskFilterUtils', () => {
  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', tags: ['urgent', 'work'] },
    { id: '2', title: 'Task 2', tags: ['work', 'personal'] },
    { id: '3', title: 'Task 3', tags: ['urgent'] },
  ];

  // AND条件フィルタリング
  test('should filter tasks with AND condition', () => {
    const result = filterTasks(mockTasks, {
      selectedTags: ['urgent', 'work'],
      filterMode: 'AND'
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  // OR条件フィルタリング
  test('should filter tasks with OR condition', () => {
    const result = filterTasks(mockTasks, {
      selectedTags: ['urgent', 'personal'],
      filterMode: 'OR'
    });
    expect(result).toHaveLength(3);
  });

  // 空のフィルター
  test('should return all tasks when no tags selected', () => {
    const result = filterTasks(mockTasks, {
      selectedTags: [],
      filterMode: 'AND'
    });
    expect(result).toEqual(mockTasks);
  });
});
```

### C) インテグレーションテスト

```typescript
// __tests__/integration/taskFilter.integration.test.tsx

describe('Task Filter Integration', () => {
  // ページ全体での動作確認
  test('should filter tasks and update bubble view', async () => {
    // 1. タスクが表示されることを確認
    // 2. フィルターでタグを選択
    // 3. バブルビューが更新されることを確認
  });

  // API連携テスト
  test('should fetch tags from API and sort correctly', async () => {
    // 1. API からタグデータを取得
    // 2. 使用量順にソートされることを確認
  });

  // パフォーマンステスト
  test('should handle large number of tasks efficiently', () => {
    // 大量のタスクデータでの動作確認
  });
});
```

### D) E2Eテスト (Playwright)

```typescript
// e2e/taskFilter.spec.ts

test.describe('Task Filter E2E', () => {
  test('complete filter workflow', async ({ page }) => {
    // 1. ページを開く
    await page.goto('/');
    
    // 2. タスクを作成
    await page.fill('[data-testid="task-title"]', 'Test Task');
    await page.fill('[data-testid="tag-input"]', 'urgent');
    await page.press('[data-testid="tag-input"]', 'Enter');
    await page.click('[data-testid="submit-task"]');
    
    // 3. フィルターパネルを操作
    await page.click('[data-testid="filter-toggle"]');
    await page.check('[data-testid="tag-checkbox-urgent"]');
    
    // 4. フィルタリング結果を確認
    await expect(page.locator('[data-testid="task-bubble"]')).toHaveCount(1);
    
    // 5. 条件を AND から OR に変更
    await page.selectOption('[data-testid="filter-mode"]', 'OR');
    
    // 6. 折りたたみ機能をテスト
    await page.click('[data-testid="collapse-toggle"]');
    await expect(page.locator('[data-testid="tag-list"]')).toHaveClass(/collapsed/);
  });
});
```

## 🔧 テスト環境設定

### Jest設定
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### テストデータモック
```typescript
// __mocks__/taskData.ts
export const mockTagsResponse = [
  { name: 'urgent', count: 10, lastUsed: '2024-01-01' },
  { name: 'work', count: 8, lastUsed: '2024-01-02' },
  // ... more test data
];

export const mockTasksResponse = [
  // ... test task data
];
```

## 🚀 実装順序

1. **型定義作成** - TaskFilter, TagWithCountインターフェース
2. **page.tsxにフィルター状態管理を追加** 
3. **TaskFilterPanelコンポーネントの基本構造作成**
4. **タグ取得・ソート処理の実装**
5. **タスクフィルタリングロジックの実装**
6. **折りたたみ機能とUIインタラクションの実装**
7. **スタイリングとレスポンシブ対応**
8. **フィルター機能のテスト実行と動作確認**

## 📊 テスト実行計画

1. **開発中**: 単体テスト（Jest）を継続実行
2. **機能完成後**: インテグレーションテスト実行
3. **リリース前**: E2Eテスト実行
4. **カバレッジ目標**: 80%以上

## 📝 配置場所

```typescript
// page.tsx の構成
<div className="container">
  <h1>タスクマネージャー</h1>
  <TaskForm onSubmit={handleTaskSubmit} />
  
  {/* 新規追加 */}
  <TaskFilterPanel 
    availableTags={availableTags}
    selectedTags={selectedTags}
    filterMode={filterMode}
    isCollapsed={isFilterCollapsed}
    onFilterChange={handleFilterChange}
  />
  
  <TaskBubbleView tasks={filteredTasks} />
</div>
```

---
作成日: 2024-12-18
状態: 設計・計画完了、実装待機中