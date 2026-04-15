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

func createTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
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

		allTasks, err := taskRepo.GetTasks(context.TODO(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
			return
		}

		tasks := make([]models.Task, 0)
		completed := c.Query("completed")
		for _, task := range allTasks {
			switch completed {
			case "true":
				if task.Completed {
					tasks = append(tasks, task)
				}
			case "false":
				if !task.Completed {
					tasks = append(tasks, task)
				}
			default:
				tasks = append(tasks, task)
			}
		}

		c.JSON(http.StatusOK, gin.H{"tasks": tasks, "count": len(tasks)})
	}
}

func getTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		task, err := taskRepo.GetTask(context.TODO(), userID, c.Param("id"))
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
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Importance  int     `json:"importance"`
	Cost        int     `json:"cost"`
	Completed   *bool   `json:"completed"`
	ParentID    *string `json:"parent_id"`
	NodeType    string  `json:"node_type"`
}

func updateTask(taskRepo *repository.TaskRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req updateTaskRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		task, err := taskRepo.GetTask(context.TODO(), userID, c.Param("id"))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}
		if task == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}

		if req.Title != "" {
			task.Title = req.Title
		}
		if req.Description != "" {
			task.Description = req.Description
		}
		if req.Importance != 0 {
			task.Importance = req.Importance
		}
		if req.Cost != 0 {
			task.Cost = req.Cost
		}
		if req.Completed != nil {
			task.Completed = *req.Completed
		}
		if req.ParentID != nil {
			task.ParentID = *req.ParentID
		}
		if req.NodeType != "" {
			task.NodeType = req.NodeType
		}
		task.UpdatedAt = time.Now()

		if err := taskRepo.UpdateTask(context.TODO(), userID, task.ID, task); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
			return
		}

		c.JSON(http.StatusOK, task)
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
		task, err := taskRepo.GetTask(context.TODO(), userID, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
			return
		}
		if task == nil {
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

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func main() {
	dbClient, err := config.NewDynamoDBClient()
	if err != nil {
		log.Fatalf("Failed to create DynamoDB client: %v", err)
	}

	taskRepo := repository.NewTaskRepository(dbClient.Client, dbClient.TableName)

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
	r.POST("/tasks", createTask(taskRepo))
	r.GET("/tasks", getTasks(taskRepo))
	r.GET("/task/:id", getTask(taskRepo))
	r.PUT("/task/:id", updateTask(taskRepo))
	r.DELETE("/task/:id", deleteTask(taskRepo))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
