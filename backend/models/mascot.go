package models

import "time"

type Mascot struct {
	PK                  string    `json:"-"                    dynamodbav:"pk"`
	SK                  string    `json:"-"                    dynamodbav:"sk"`
	UserID              string    `json:"user_id"              dynamodbav:"user_id"`
	CurrentPoints       int       `json:"current_points"       dynamodbav:"current_points"`
	TotalEarnedPoints   int       `json:"total_earned_points"  dynamodbav:"total_earned_points"`
	PersonalityPreset   string    `json:"personality_preset"   dynamodbav:"personality_preset"`
	UnlockedPresets     []string  `json:"unlocked_presets"     dynamodbav:"unlocked_presets"`
	OwnedAccessories    []string  `json:"owned_accessories"    dynamodbav:"owned_accessories"`
	EquippedAccessories []string  `json:"equipped_accessories" dynamodbav:"equipped_accessories"`
	LastLoginDate       string    `json:"last_login_date"      dynamodbav:"last_login_date"`
	UnlockedSlots       int       `json:"unlocked_slots"       dynamodbav:"unlocked_slots"`
	CreatedAt           time.Time `json:"created_at"           dynamodbav:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"           dynamodbav:"updated_at"`
}
