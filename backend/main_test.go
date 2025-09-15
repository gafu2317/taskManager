// backend/main_test.go
package main

import (
	"testing"
)

func TestBasic(t *testing.T) {
	// 基本的なテスト
	result := 1 + 1
	expected := 2
	
	if result != expected {
		t.Errorf("期待値: %d, 実際: %d", expected, result)
	}
}

func TestStringOperation(t *testing.T) {
	message := "Hello, Go CI/CD!"
	
	if len(message) == 0 {
		t.Error("メッセージが空です")
	}
	
	if message[0:5] != "Hello" {
		t.Error("メッセージの開始が正しくありません")
	}
}

// 将来的にここにAPIテストを追加
func TestAPI(t *testing.T) {
	t.Skip("APIテストは後で実装予定")
}