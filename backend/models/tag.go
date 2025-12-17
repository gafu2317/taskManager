package models

import "time"

type Tag struct {
	ID       string    `json:"id" dynamodbav:"id"`
	Name 		string    `json:"name" dynamodbav:"name"`
	Count 	int       `json:"count" dynamodbav:"count"`
	LastUsed time.Time `json:"last_used" dynamodbav:"last_used"`
}