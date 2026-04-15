package models

import "time"

type Task struct {
	PK             string    `json:"-" dynamodbav:"pk"`
	SK             string    `json:"-" dynamodbav:"sk"`
	ID             string    `json:"id" dynamodbav:"id"`
	UserID         string    `json:"user_id" dynamodbav:"user_id"`
	ParentID       string    `json:"parent_id" dynamodbav:"parent_id"`
	NodeType       string    `json:"node_type" dynamodbav:"node_type"` // "goal" | "task"
	Title          string    `json:"title" dynamodbav:"title"`
	Description    string    `json:"description" dynamodbav:"description"`
	Completed      bool      `json:"completed" dynamodbav:"completed"`
	Importance     int       `json:"importance" dynamodbav:"importance"`
	Cost           int       `json:"cost" dynamodbav:"cost"`
	Tags           []string  `json:"tags" dynamodbav:"tags"`
	TotalWorkTime  int       `json:"total_work_time" dynamodbav:"total_work_time"`
	TotalBreakTime int       `json:"total_break_time" dynamodbav:"total_break_time"`
	CreatedAt      time.Time `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" dynamodbav:"updated_at"`
}