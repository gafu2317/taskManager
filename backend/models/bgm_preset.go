package models

import "time"

type BGMPreset struct {
	PK        string    `json:"-" dynamodbav:"pk"`
	SK        string    `json:"-" dynamodbav:"sk"`
	PresetID  string    `json:"preset_id" dynamodbav:"preset_id"`
	Label     string    `json:"label" dynamodbav:"label"`
	VideoID   string    `json:"video_id" dynamodbav:"video_id"`
	CreatedAt time.Time `json:"created_at" dynamodbav:"created_at"`
}
