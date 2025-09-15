package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Task Manager API is running",
	})
}

func main() {
	r := gin.Default()
	r.GET("/health", healthCheck)
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
