// frontend/__tests__/example.test.ts

describe('基本テスト', () => {
  test('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });

  test('文字列テスト', () => {
    const message = 'Hello, CI/CD!';
    expect(message).toContain('CI/CD');
  });
});

// 将来的にここにコンポーネントテストを追加
describe('コンポーネントテスト（準備中）', () => {
  test.skip('TaskFormコンポーネント', () => {
    // TODO: Reactコンポーネントのテストを実装
  });
});