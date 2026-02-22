package models

import "time"

type WorkSession struct {
	PK        string    `json:"-" dynamodbav:"pk"`
	SK        string    `json:"-" dynamodbav:"sk"`
	SessionID string    `json:"session_id" dynamodbav:"session_id"`
	TaskID    string    `json:"task_id" dynamodbav:"task_id"`
	TaskTitle string    `json:"task_title" dynamodbav:"task_title"`
	Date      string    `json:"date" dynamodbav:"date"`
	WorkTime  int       `json:"work_time" dynamodbav:"work_time"`
	BreakTime int       `json:"break_time" dynamodbav:"break_time"`
	StartedAt time.Time `json:"started_at" dynamodbav:"started_at"`
	EndedAt   time.Time `json:"ended_at" dynamodbav:"ended_at"`
}
