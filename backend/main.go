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
	"strconv"
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
		if newTask.Importance != 0 && (newTask.Importance < 1 || newTask.Importance > 5) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Importance must be between 1 and 5"})
			return
		}
		if newTask.Cost != 0 && (newTask.Cost < 1 || newTask.Cost > 5) {
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
	ParentID       *string  `json:"parent_id"`
	NodeType       string   `json:"node_type"`
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
		if updatedData.ParentID != nil {
			existingTask.ParentID = *updatedData.ParentID
		}
		if updatedData.NodeType != "" {
			existingTask.NodeType = updatedData.NodeType
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

func createBGMPreset(bgmRepo *repository.BGMRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req struct {
			Label   string `json:"label"`
			VideoID string `json:"video_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Label == "" || req.VideoID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "label and video_id are required"})
			return
		}

		preset := &models.BGMPreset{
			PresetID:  fmt.Sprintf("%d", time.Now().UnixNano()),
			Label:     req.Label,
			VideoID:   req.VideoID,
			CreatedAt: time.Now(),
		}
		if err := bgmRepo.CreatePreset(context.TODO(), userID, preset); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create preset"})
			return
		}
		c.JSON(http.StatusCreated, preset)
	}
}

func getBGMPresets(bgmRepo *repository.BGMRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		presets, err := bgmRepo.GetPresets(context.TODO(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get presets"})
			return
		}
		if presets == nil {
			presets = []models.BGMPreset{}
		}
		c.JSON(http.StatusOK, gin.H{"presets": presets})
	}
}

func deleteBGMPreset(bgmRepo *repository.BGMRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		presetID := c.Param("id")
		if err := bgmRepo.DeletePreset(context.TODO(), userID, presetID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete preset"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "deleted"})
	}
}

var accessoryPrices = map[string]int{
	"ribbon":  30,
	"hat":     50,
	"glasses": 80,
	"scarf":   40,
	"crown":   200,
}

// スロット解放コスト（スロット番号 → 必要ポイント）
var slotUnlockCosts = map[int]int{
	2: 500,
	3: 1000,
}

const maxSlots = 3

// 有効なプリセットIDとコストのマップ
var presetCosts = map[string]int{
	"flat":      0,
	"genki":     100,
	"amaenbou":  150,
	"tennen":    150,
	"tsundere":  200,
	"majime":    200,
	"nekketsu":  300,
	"cool":      300,
}

type mascotActionRequest struct {
	Type        string `json:"type"`
	WorkSeconds int    `json:"work_seconds"`
}

type presetRequest struct {
	PresetID string `json:"preset_id"`
}

type shopBuyRequest struct {
	AccessoryID string `json:"accessory_id"`
}

type equipRequest struct {
	Equipped []string `json:"equipped"`
}

type unlockSlotRequest struct {
	Slot int `json:"slot"`
}

// クエリパラメータ ?slot= を読む（デフォルト1）
func getSlot(c *gin.Context) int {
	s, err := strconv.Atoi(c.DefaultQuery("slot", "1"))
	if err != nil || s < 1 {
		return 1
	}
	return s
}

func getMascot(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}
		mascot, err := mascotRepo.GetMascot(context.TODO(), userID, getSlot(c))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
			return
		}
		c.JSON(http.StatusOK, mascot)
	}
}

func postMascotAction(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req mascotActionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// ポイント付与・ログインボーナスは常にスロット1
		mascot, err := mascotRepo.GetMascot(context.TODO(), userID, 1)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
			return
		}

		earned := 0
		today := time.Now().Format("2006-01-02")

		switch req.Type {
		case "task_complete":
			earned = 10
		case "work_session":
			earned = (req.WorkSeconds / 1800) * 10
		case "login":
			if mascot.LastLoginDate != today {
				earned = 5
				mascot.LastLoginDate = today
			}
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid action type"})
			return
		}

		mascot.CurrentPoints += earned
		mascot.TotalEarnedPoints += earned

		if err := mascotRepo.SaveMascot(context.TODO(), userID, 1, mascot); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"earned_points":  earned,
			"current_points": mascot.CurrentPoints,
		})
	}
}

func postMascotPreset(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req presetRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		cost, valid := presetCosts[req.PresetID]
		if !valid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid preset_id"})
			return
		}

		slot := getSlot(c)
		mascot, err := mascotRepo.GetMascot(context.TODO(), userID, slot)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
			return
		}

		// 既に解放済みか確認
		alreadyUnlocked := false
		for _, p := range mascot.UnlockedPresets {
			if p == req.PresetID {
				alreadyUnlocked = true
				break
			}
		}

		if !alreadyUnlocked {
			// 未解放: ポイント消費して解放
			if mascot.CurrentPoints < cost {
				c.JSON(http.StatusBadRequest, gin.H{"error": "not enough points"})
				return
			}
			mascot.CurrentPoints -= cost
			mascot.UnlockedPresets = append(mascot.UnlockedPresets, req.PresetID)
		}

		mascot.PersonalityPreset = req.PresetID

		if err := mascotRepo.SaveMascot(context.TODO(), userID, slot, mascot); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
			return
		}

		c.JSON(http.StatusOK, mascot)
	}
}

func postMascotShopBuy(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req shopBuyRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		price, ok := accessoryPrices[req.AccessoryID]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid accessory_id"})
			return
		}

		slot := getSlot(c)
		mascot, err := mascotRepo.GetMascot(context.TODO(), userID, slot)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
			return
		}

		for _, id := range mascot.OwnedAccessories {
			if id == req.AccessoryID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "already owned"})
				return
			}
		}

		if mascot.CurrentPoints < price {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not enough points"})
			return
		}

		mascot.CurrentPoints -= price
		mascot.OwnedAccessories = append(mascot.OwnedAccessories, req.AccessoryID)

		if err := mascotRepo.SaveMascot(context.TODO(), userID, slot, mascot); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
			return
		}

		c.JSON(http.StatusOK, mascot)
	}
}

func putMascotEquip(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req equipRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		slot := getSlot(c)
		mascot, err := mascotRepo.GetMascot(context.TODO(), userID, slot)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
			return
		}

		ownedSet := make(map[string]bool)
		for _, id := range mascot.OwnedAccessories {
			ownedSet[id] = true
		}
		for _, id := range req.Equipped {
			if !ownedSet[id] {
				c.JSON(http.StatusBadRequest, gin.H{"error": "accessory not owned: " + id})
				return
			}
		}

		mascot.EquippedAccessories = req.Equipped

		if err := mascotRepo.SaveMascot(context.TODO(), userID, slot, mascot); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
			return
		}

		c.JSON(http.StatusOK, mascot)
	}
}

func postMascotUnlock(mascotRepo *repository.MascotRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var req unlockSlotRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Slot < 2 || req.Slot > maxSlots {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slot number"})
			return
		}

		cost, ok := slotUnlockCosts[req.Slot]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slot number"})
			return
		}

		// スロット1からポイントを消費して解放
		slot1, err := mascotRepo.GetMascot(context.TODO(), userID, 1)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get mascot"})
			return
		}

		if slot1.UnlockedSlots >= req.Slot {
			c.JSON(http.StatusBadRequest, gin.H{"error": "slot already unlocked"})
			return
		}
		if req.Slot != slot1.UnlockedSlots+1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "must unlock slots in order"})
			return
		}
		if slot1.CurrentPoints < cost {
			c.JSON(http.StatusBadRequest, gin.H{"error": "not enough points"})
			return
		}

		slot1.CurrentPoints -= cost
		slot1.UnlockedSlots = req.Slot

		if err := mascotRepo.SaveMascot(context.TODO(), userID, 1, slot1); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save mascot"})
			return
		}

		c.JSON(http.StatusOK, slot1)
	}
}

func createHabit(habitRepo *repository.HabitRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var habit models.Habit
		if err := c.ShouldBindJSON(&habit); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if habit.Title == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
			return
		}

		habit.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		habit.UserID = userID
		habit.CreatedAt = time.Now()
		habit.UpdatedAt = time.Now()

		if err := habitRepo.CreateHabit(context.TODO(), userID, &habit); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create habit"})
			return
		}

		c.JSON(http.StatusCreated, habit)
	}
}

func getHabits(habitRepo *repository.HabitRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		habits, err := habitRepo.GetHabits(context.TODO(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get habits"})
			return
		}
		if habits == nil {
			habits = []models.Habit{}
		}

		c.JSON(http.StatusOK, gin.H{"habits": habits, "count": len(habits)})
	}
}

func deleteHabit(habitRepo *repository.HabitRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")
		if err := habitRepo.DeleteHabit(context.TODO(), userID, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete habit"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "deleted", "id": id})
	}
}

func graduateHabit(habitRepo *repository.HabitRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		id := c.Param("id")

		var req struct {
			PeakStreak  int    `json:"peak_streak"`
			GraduatedAt string `json:"graduated_at"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		habit, err := habitRepo.GetHabit(context.TODO(), userID, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get habit"})
			return
		}
		if habit == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Habit not found"})
			return
		}

		habit.Graduated = true
		habit.GraduatedAt = req.GraduatedAt
		habit.PeakStreak = req.PeakStreak
		habit.UpdatedAt = time.Now()

		if err := habitRepo.UpdateHabit(context.TODO(), userID, habit); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to graduate habit"})
			return
		}

		c.JSON(http.StatusOK, habit)
	}
}

func createHabitRecord(habitRepo *repository.HabitRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		var record models.HabitRecord
		if err := c.ShouldBindJSON(&record); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if record.HabitID == "" || record.Date == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "habit_id and date are required"})
			return
		}
		if record.Completed != "mini" && record.Completed != "full" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "completed must be 'mini' or 'full'"})
			return
		}

		record.ID = fmt.Sprintf("%d", time.Now().UnixNano())
		record.CreatedAt = time.Now()

		if err := habitRepo.UpsertHabitRecord(context.TODO(), userID, &record); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save habit record"})
			return
		}

		c.JSON(http.StatusCreated, record)
	}
}

func getHabitRecords(habitRepo *repository.HabitRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-ID")
		if userID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "X-User-ID header is required"})
			return
		}

		habitID := c.Query("habit_id")
		if habitID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "habit_id query param is required"})
			return
		}

		dateFrom := c.Query("date_from")
		dateTo := c.Query("date_to")

		records, err := habitRepo.GetHabitRecords(context.TODO(), userID, habitID, dateFrom, dateTo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get habit records"})
			return
		}
		if records == nil {
			records = []models.HabitRecord{}
		}

		c.JSON(http.StatusOK, gin.H{"records": records, "count": len(records)})
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
	bgmRepo := repository.NewBGMRepository(dbClient.Client, tableName)
	mascotRepo := repository.NewMascotRepository(dbClient.Client, tableName)
	habitRepo := repository.NewHabitRepository(dbClient.Client, tableName)

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
	r.POST("/bgm-presets", createBGMPreset(bgmRepo))
	r.GET("/bgm-presets", getBGMPresets(bgmRepo))
	r.DELETE("/bgm-preset/:id", deleteBGMPreset(bgmRepo))
	r.GET("/mascot", getMascot(mascotRepo))
	r.POST("/mascot/action", postMascotAction(mascotRepo))
	r.POST("/mascot/preset", postMascotPreset(mascotRepo))
	r.POST("/mascot/shop/buy", postMascotShopBuy(mascotRepo))
	r.PUT("/mascot/equip", putMascotEquip(mascotRepo))
	r.POST("/mascot/unlock", postMascotUnlock(mascotRepo))
	r.POST("/habits", createHabit(habitRepo))
	r.GET("/habits", getHabits(habitRepo))
	r.DELETE("/habit/:id", deleteHabit(habitRepo))
	r.PUT("/habit/:id/graduate", graduateHabit(habitRepo))
	r.POST("/habit-records", createHabitRecord(habitRepo))
	r.GET("/habit-records", getHabitRecords(habitRepo))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	log.Fatal(r.Run(":" + port))
}
