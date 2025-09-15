package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestBasic(t *testing.T) {
	result := 1 + 1
	expected := 2
	
	if result != expected {
		t.Errorf("期待値: %d, 実際: %d", expected, result)
	}
}

func TestHealthCheck(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.New()
	r.GET("/health", healthCheck)
	
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "ok")
}
