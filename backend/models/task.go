package models

import "time"

type Task struct {
	ID						string		`json:"id" dynamodbav:"id"`
	UserID				string		`json:"user_id" dynamodbav:"user_id"`
	Title					string		`json:"title" dynamodbav:"title"`
	Description		string		`json:"description" dynamodbav:"description"`
	Completed			bool			`json:"completed" dynamodbav:"completed"`
	Importance		int				`json:"importance" dynamodbav:"importance"`
	Cost					int				`json:"cost" dynamodbav:"cost"`
	Tags					[]string	`json:"tags" dynamodbav:"tags"`
	CreatedAt			time.Time	`json:"created_at" dynamodbav:"created_at"`
	UpdatedAt			time.Time	`json:"updated_at" dynamodbav:"updated_at"`
}