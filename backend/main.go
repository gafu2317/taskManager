package main

import (
	"context"
	"fmt"
	"log"
	"my-webapp-backend/config"
	"my-webapp-backend/models"
	"my-webapp-backend/repository"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

// DynamoDB ハンドラー用
func createTask(taskRepo *repository.TaskRepository, tagRepo *repository.TagRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newTask models.Task

		// ユーザーIDをヘッダーから取得
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

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

		// タグ処理（DynamoDB版）
		for _, tagName := range newTask.Tags {
			existingTag, err := tagRepo.GetTagByName(context.TODO(), tagName)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check tag"})
				return
			}
			
			if existingTag != nil {
				// 既存タグの更新
				existingTag.Count++
				existingTag.LastUsed = time.Now()
				err = tagRepo.UpsertTag(context.TODO(), existingTag)
			} else {
				// 新規タグの作成
				newTag := &models.Tag{
					ID:       tagName, // IDとして名前を使用
					Name:     tagName,
					Count:    1,
					LastUsed: time.Now(),
				}
				err = tagRepo.UpsertTag(context.TODO(), newTag)
			}
			
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tag"})
				return
			}
		}

		//IDとタイムスタンプ、ユーザーIDを設定
		newTask.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		newTask.UserID = userID
		newTask.CreatedAt = time.Now()
		newTask.UpdatedAt = time.Now()

		// DynamoDBに保存
		err := taskRepo.CreateTask(context.TODO(), &newTask)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
			return
		}

		//作成したタスクを返す
		c.JSON(http.StatusCreated, newTask)
	}
}

// DynamoDB版は一時的にコメントアウト
/*
func createTaskWithDB(repo *repository.TaskRepository) gin.HandlerFunc {
	// DynamoDB実装はここに保存済み
	// 後で復活させる
}
*/

func getTasks(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ユーザーIDをヘッダーから取得
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		completed := c.Query("completed")
		
		// DynamoDBから全タスクを取得
		allTasks, err := taskRepo.GetTasks(context.TODO())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
			return
		}
		
		filteredTasks := make([]models.Task, 0)
		
		// ユーザーIDとクエリパラメータに応じてフィルタリング
		for _, task := range allTasks {
			// まずユーザーIDでフィルタリング
			if task.UserID != userID {
				continue
			}

			shouldInclude := false
			
			if completed == "" {
				// パラメータなし = 全て返す
				shouldInclude = true
			} else if completed == "true" {
				// completed=true = 完了済みのみ
				shouldInclude = task.Completed
			} else if completed == "false" {
				// completed=false = 未完了のみ
				shouldInclude = !task.Completed
			}
			
			if shouldInclude {
				filteredTasks = append(filteredTasks, task)
			}
		}
		
		c.JSON(http.StatusOK, gin.H{
			"tasks": filteredTasks,
			"count": len(filteredTasks),
		})
	}
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

func getTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// DynamoDBからタスクを取得
		task, err := taskRepo.GetTask(context.TODO(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}
		
		if task == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		
		c.JSON(http.StatusOK, task)
	}
}

type updateTaskRequest struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Importance     int      `json:"importance"`
	Cost           int      `json:"cost"`
	Tags           []string `json:"tags"`
	Completed      *bool    `json:"completed"`
	TotalWorkTime  int      `json:"total_work_time"`
	TotalBreakTime int      `json:"total_break_time"`
}

func updateTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ユーザーIDをヘッダーから取得
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")

		//更新データを受け取る構造体
		var updatedData updateTaskRequest
		if err := c.ShouldBindJSON(&updatedData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 既存タスクを取得
		existingTask, err := taskRepo.GetTask(context.TODO(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}

		if existingTask == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		// 所有者チェック
		if existingTask.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		//フィールドを更新
		if updatedData.Title != "" {
			existingTask.Title = updatedData.Title
		}
		if updatedData.Description != "" {
			existingTask.Description = updatedData.Description
		}
		if updatedData.Importance != 0 {
			existingTask.Importance = updatedData.Importance
		}
		if updatedData.Cost != 0 {
			existingTask.Cost = updatedData.Cost
		}
		if updatedData.Tags != nil {
			existingTask.Tags = updatedData.Tags
		}
		if updatedData.Completed != nil {
			existingTask.Completed = *updatedData.Completed
		}
		if updatedData.TotalWorkTime > 0 {
			existingTask.TotalWorkTime = updatedData.TotalWorkTime
		}
		if updatedData.TotalBreakTime > 0 {
			existingTask.TotalBreakTime = updatedData.TotalBreakTime
		}
		existingTask.UpdatedAt = time.Now()

		// DynamoDBに保存
		err = taskRepo.UpdateTask(context.TODO(), id, existingTask)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
			return
		}

		c.JSON(http.StatusOK, existingTask)
	}
}

func deleteTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ユーザーIDをヘッダーから取得
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")

		// まずタスクが存在するか確認
		existingTask, err := taskRepo.GetTask(context.TODO(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}
		
		if existingTask == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		// 所有者チェック
		if existingTask.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		// DynamoDBから削除
		err = taskRepo.DeleteTask(context.TODO(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Task deleted", "id": id})
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Task Manager API is running",
	})
}

func getTags(tagRepo *repository.TagRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// DynamoDBから全タグを取得
		allTags, err := tagRepo.GetAllTags(context.TODO())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tags"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"tags": allTags,
			"count": len(allTags),
		})
	}
}

func main() {
	// DynamoDB接続
	dbClient, err := config.NewDynamoDBClient()
	if err != nil {
		log.Fatalf("Failed to create DynamoDB client: %v", err)
	}
	
	taskRepo := repository.NewTaskRepository(dbClient.Client)
	tagRepo := repository.NewTagRepository(dbClient.Client)

	r := gin.Default()

	// CORS設定（本番環境とローカル両対応）
	allowedOrigins := []string{"http://localhost:3000"}
	if prodOrigin := os.Getenv("FRONTEND_URL"); prodOrigin != "" {
		allowedOrigins = append(allowedOrigins, prodOrigin)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "X-User-ID"},
		AllowCredentials: true,
	}))
	
	r.GET("/health", healthCheck)
	r.POST("/tasks", createTask(taskRepo, tagRepo))
	r.GET("/tasks", getTasks(taskRepo))
	r.GET("/task/:id", getTask(taskRepo))
	r.PUT("/task/:id", updateTask(taskRepo))
	r.DELETE("/task/:id", deleteTask(taskRepo))
	r.GET("/tags", getTags(tagRepo))
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
