package models

import "time"

type Habit struct {
	PK          string    `json:"-" dynamodbav:"pk"`
	SK          string    `json:"-" dynamodbav:"sk"`
	ID          string    `json:"id" dynamodbav:"id"`
	UserID      string    `json:"user_id" dynamodbav:"user_id"`
	Title       string    `json:"title" dynamodbav:"title"`
	MiniVersion string    `json:"mini_version" dynamodbav:"mini_version"`
	FullVersion string    `json:"full_version" dynamodbav:"full_version"`
	Graduated   bool      `json:"graduated" dynamodbav:"graduated"`
	GraduatedAt string    `json:"graduated_at" dynamodbav:"graduated_at"`
	PeakStreak  int       `json:"peak_streak" dynamodbav:"peak_streak"`
	CreatedAt   time.Time `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" dynamodbav:"updated_at"`
}

type HabitRecord struct {
	PK        string    `json:"-" dynamodbav:"pk"`
	SK        string    `json:"-" dynamodbav:"sk"`
	ID        string    `json:"id" dynamodbav:"id"`
	HabitID   string    `json:"habit_id" dynamodbav:"habit_id"`
	Date      string    `json:"date" dynamodbav:"date"` // YYYY-MM-DD
	Completed string    `json:"completed" dynamodbav:"completed"` // "mini" | "full"
	CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"`
}
