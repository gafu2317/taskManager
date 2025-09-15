package main

import "testing"

func TestBasic(t *testing.T) {
	result := 1 + 1
	expected := 2
	
	if result != expected {
		t.Errorf("期待値: %d, 実際: %d", expected, result)
	}
}