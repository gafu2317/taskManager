package main

import (
	"fmt"
	"log"
	"my-webapp-backend/models"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

//一時的なスライス
var tasks []models.Task

//POST /tasks ハンドラー
func createTask(c *gin.Context){
	var newTask models.Task

	//JSONリクエストを構造体にバインド
	if err := c.ShouldBindJSON(&newTask); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//IDとタイムスタンプを設定
	newTask.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	newTask.CreatedAt = time.Now()
	newTask.UpdatedAt = time.Now()

	//タスクをスライスに追加
	tasks = append(tasks, newTask)

	//作成したタスクを返す
	c.JSON(http.StatusCreated, newTask)
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Task Manager API is running",
	})
}

func main() {
	r := gin.Default()
	r.GET("/health", healthCheck)
	r.POST("/tasks", createTask)
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
