package models

import "time"

type Tag struct {
	Name 		string    `json:"name" dynamodbav:"name"`
	Count 	int       `json:"count" dynamodbav:"count"`
	LastUsed time.Time `json:"last_used" dynamodbav:"last_used"`
}