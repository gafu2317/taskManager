package main

import (
	"fmt"
	"log"
	"my-webapp-backend/models"
	"net/http"
	"os"
	"time"
	// DynamoDB関連は一時的にコメントアウト
	// "context"
	// "my-webapp-backend/config"
	// "my-webapp-backend/repository"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

//一時的なスライス
var tasks []models.Task

//POST /tasks ハンドラー
func createTask(c *gin.Context) {
	var newTask models.Task

	//JSONリクエストを構造体にバインド
	if err := c.ShouldBindJSON(&newTask); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	//バリデーション
	if newTask.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}
	if newTask.Importance < 1 || newTask.Importance > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Importance must be between 1 and 5"})
		return
	}
	if newTask.Cost < 1 || newTask.Cost > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cost must be non-negative"})
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

// DynamoDB版は一時的にコメントアウト
/*
func createTaskWithDB(repo *repository.TaskRepository) gin.HandlerFunc {
	// DynamoDB実装はここに保存済み
	// 後で復活させる
}
*/

func getTasks(c *gin.Context) {
	completed := c.Query("completed")
	
	var filteredTasks []models.Task
	
	// クエリパラメータに応じてフィルタリング
	for _, task := range tasks {
		if completed == "" {
			// パラメータなし = 全て返す
			filteredTasks = append(filteredTasks, task)
		} else if completed == "true" && task.Completed {
			// completed=true = 完了済みのみ
			filteredTasks = append(filteredTasks, task)
		} else if completed == "false" && !task.Completed {
			// completed=false = 未完了のみ
			filteredTasks = append(filteredTasks, task)
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"tasks": filteredTasks,
		"count": len(filteredTasks),
	})
}

// DynamoDB版は一時的にコメントアウト
/*
func getTasksWithDB(repo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		//DynamoDBからタスクを取得
		tasks, err := repo.GetTasks(context.TODO())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"tasks": tasks,
			"count": len(tasks),
		})
	}
}
*/

func getTask(c *gin.Context) {
		id := c.Param("id")

	//タスクを検索
	for _, task := range tasks {
		if task.ID == id {
			c.JSON(http.StatusOK, task)
			return
		}
	}
	
	//タスクが見つからない場合
	c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
}

func updateTask(c *gin.Context) {
	id := c.Param("id")

	//更新データを受け取る構造体
	var updatedData models.Task
	if err := c.ShouldBindJSON(&updatedData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	//既存タスクを検索して更新
	for i, task := range tasks {
		if task.ID == id {
			//フィールドを更新
			if updatedData.Title != "" {
				tasks[i].Title = updatedData.Title
			}
			if updatedData.Description != "" {
				tasks[i].Description = updatedData.Description
			}
			if updatedData.Importance != 0 {
				tasks[i].Importance = updatedData.Importance
			}
			if updatedData.Cost != 0 {
				tasks[i].Cost = updatedData.Cost
			}
			if updatedData.Tags != nil {
				tasks[i].Tags = updatedData.Tags
			}
			tasks[i].Completed = updatedData.Completed
			tasks[i].UpdatedAt = time.Now()

			c.JSON(http.StatusOK, tasks[i])
			return
		}
	}
	//タスクが見つからない場合
	c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
}

func deleteTask(c *gin.Context) {
	id := c.Param("id")

	//タスクを検索して削除
	for i, task := range tasks {
		if task.ID == id {
			tasks = append(tasks[:i], tasks[i+1:]...)
			c.JSON(http.StatusOK, gin.H{"message": "Task deleted", "id": id})
			return
		}
	}
	//タスクが見つからない場合
	c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Task Manager API is running",
	})
}

func main() {
	// DynamoDB接続は一時的にコメントアウト
	/*
	dbClient, err := config.NewDynamoDBClient()
	if err != nil {
		log.Fatalf("Failed to create DynamoDB client: %v", err)
	}
	taskRepo := repository.NewTaskRepository(dbClient.Client)
	*/

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
	}))
	r.GET("/health", healthCheck)
	r.POST("/tasks", createTask)           // メモリ版に戻す
	r.GET("/tasks", getTasks)              // メモリ版に戻す  
	r.GET("/task/:id", getTask)
	r.PUT("/task/:id", updateTask)
	r.DELETE("/task/:id", deleteTask)
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
