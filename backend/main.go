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

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func createTask(taskRepo *repository.TaskRepository, tagRepo *repository.TagRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var newTask models.Task
		if err := c.ShouldBindJSON(&newTask); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
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

		// タグ処理
		for _, tagName := range newTask.Tags {
			existingTag, err := tagRepo.GetTagByName(context.TODO(), userID, tagName)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check tag"})
				return
			}

			if existingTag != nil {
				existingTag.Count++
				existingTag.LastUsed = time.Now()
				err = tagRepo.UpsertTag(context.TODO(), userID, existingTag)
			} else {
				newTag := &models.Tag{
					Name:     tagName,
					Count:    1,
					LastUsed: time.Now(),
				}
				err = tagRepo.UpsertTag(context.TODO(), userID, newTag)
			}

			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tag"})
				return
			}
		}

		newTask.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		newTask.UserID = userID
		newTask.CreatedAt = time.Now()
		newTask.UpdatedAt = time.Now()

		if err := taskRepo.CreateTask(context.TODO(), userID, &newTask); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
			return
		}

		c.JSON(http.StatusCreated, newTask)
	}
}

func getTasks(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		completed := c.Query("completed")

		allTasks, err := taskRepo.GetTasks(context.TODO(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
			return
		}

		filteredTasks := make([]models.Task, 0)
		for _, task := range allTasks {
			switch completed {
			case "":
				filteredTasks = append(filteredTasks, task)
			case "true":
				if task.Completed {
					filteredTasks = append(filteredTasks, task)
				}
			case "false":
				if !task.Completed {
					filteredTasks = append(filteredTasks, task)
				}
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"tasks": filteredTasks,
			"count": len(filteredTasks),
		})
	}
}

func getTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")
		task, err := taskRepo.GetTask(context.TODO(), userID, id)
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
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")

		var updatedData updateTaskRequest
		if err := c.ShouldBindJSON(&updatedData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		existingTask, err := taskRepo.GetTask(context.TODO(), userID, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}
		if existingTask == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

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

		if err := taskRepo.UpdateTask(context.TODO(), userID, id, existingTask); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
			return
		}

		c.JSON(http.StatusOK, existingTask)
	}
}

func deleteTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")

		existingTask, err := taskRepo.GetTask(context.TODO(), userID, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}
		if existingTask == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		if err := taskRepo.DeleteTask(context.TODO(), userID, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Task deleted", "id": id})
	}
}

func getTags(tagRepo *repository.TagRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		tags, err := tagRepo.GetTagsByUser(context.TODO(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tags"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"tags":  tags,
			"count": len(tags),
		})
	}
}

func createSession(sessionRepo *repository.SessionRepository, taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var session models.WorkSession
		if err := c.ShouldBindJSON(&session); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if session.TaskID == "" || session.Date == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "task_id and date are required"})
			return
		}

		session.SessionID = fmt.Sprintf("%d", time.Now().UnixNano())

		if err := sessionRepo.CreateSession(context.TODO(), userID, &session); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
			return
		}

		// タスクの累積作業時間を更新
		existingTask, err := taskRepo.GetTask(context.TODO(), userID, session.TaskID)
		if err == nil && existingTask != nil {
			existingTask.TotalWorkTime += session.WorkTime
			existingTask.TotalBreakTime += session.BreakTime
			existingTask.UpdatedAt = time.Now()
			_ = taskRepo.UpdateTask(context.TODO(), userID, session.TaskID, existingTask)
		}

		c.JSON(http.StatusCreated, session)
	}
}

func getSessions(sessionRepo *repository.SessionRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		dateFrom := c.Query("date_from")
		dateTo := c.Query("date_to")

		sessions, err := sessionRepo.GetSessions(context.TODO(), userID, dateFrom, dateTo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sessions"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"sessions": sessions,
			"count":    len(sessions),
		})
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Task Manager API is running",
	})
}

func main() {
	dbClient, err := config.NewDynamoDBClient()
	if err != nil {
		log.Fatalf("Failed to create DynamoDB client: %v", err)
	}

	tableName := dbClient.TableName
	taskRepo := repository.NewTaskRepository(dbClient.Client, tableName)
	tagRepo := repository.NewTagRepository(dbClient.Client, tableName)
	sessionRepo := repository.NewSessionRepository(dbClient.Client, tableName)

	r := gin.Default()

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
	r.POST("/sessions", createSession(sessionRepo, taskRepo))
	r.GET("/sessions", getSessions(sessionRepo))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
