package models

import "time"

type Task struct {
	ID						string		`json:"id"`
	Title					string		`json:"title"`
	Description		string		`json:"description"`
	Completed			bool			`json:"completed"`
	Importance		int				`json:"importance"`
	Cost					int				`json:"cost"`
	Tags					[]string	`json:"tags"`
	CreatedAt			time.Time	`json:"created_at"`
	UpdatedAt			time.Time	`json:"updated_at"`
}