package models

import "time"

type PersonalityParams struct {
	Genki     int `json:"genki"     dynamodbav:"genki"`
	Kibishisa int `json:"kibishisa" dynamodbav:"kibishisa"`
	Amae      int `json:"amae"      dynamodbav:"amae"`
	Tsundere  int `json:"tsundere"  dynamodbav:"tsundere"`
	Majime    int `json:"majime"    dynamodbav:"majime"`
	Tennen    int `json:"tennen"    dynamodbav:"tennen"`
}

type Mascot struct {
	PK                  string            `json:"-"                    dynamodbav:"pk"`
	SK                  string            `json:"-"                    dynamodbav:"sk"`
	UserID              string            `json:"user_id"              dynamodbav:"user_id"`
	CurrentPoints       int               `json:"current_points"       dynamodbav:"current_points"`
	TotalEarnedPoints   int               `json:"total_earned_points"  dynamodbav:"total_earned_points"`
	PersonalityParams   PersonalityParams `json:"personality_params"   dynamodbav:"personality_params"`
	OwnedAccessories    []string          `json:"owned_accessories"    dynamodbav:"owned_accessories"`
	EquippedAccessories []string          `json:"equipped_accessories" dynamodbav:"equipped_accessories"`
	LastLoginDate       string            `json:"last_login_date"      dynamodbav:"last_login_date"`
	UnlockedSlots       int               `json:"unlocked_slots"       dynamodbav:"unlocked_slots"`
	CreatedAt           time.Time         `json:"created_at"           dynamodbav:"created_at"`
	UpdatedAt           time.Time         `json:"updated_at"           dynamodbav:"updated_at"`
}
