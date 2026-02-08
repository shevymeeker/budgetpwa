package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"
)

// Storage interface for all storage types
type Storage interface {
	Close() error
	GetConfig() (*Config, error)

	// Basic Config Updates
	GetCategories() ([]string, error)
	UpdateCategories(categories []string) error
	GetCurrency() (string, error)
	UpdateCurrency(currency string) error
	GetStartDate() (int, error)
	UpdateStartDate(startDate int) error

	// Recurring Expenses
	GetRecurringExpenses() ([]RecurringExpense, error)
	GetRecurringExpense(id string) (RecurringExpense, error)
	AddRecurringExpense(recurringExpense RecurringExpense) error
	RemoveRecurringExpense(id string, removeAll bool) error
	UpdateRecurringExpense(id string, recurringExpense RecurringExpense, updateAll bool) error

	// Expenses
	GetAllExpenses() ([]Expense, error)
	GetExpense(id string) (Expense, error)
	AddExpense(expense Expense) error
	RemoveExpense(id string) error
	AddMultipleExpenses(expenses []Expense) error
	RemoveMultipleExpenses(ids []string) error
	UpdateExpense(id string, expense Expense) error

}

// config for expense data
type Config struct {
	Categories        []string           `json:"categories"`
	Currency          string             `json:"currency"`
	StartDate         int                `json:"startDate"`
	RecurringExpenses []RecurringExpense `json:"recurringExpenses"`
}

type RecurringExpense struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Tags        []string  `json:"tags"`
	Category    string    `json:"category"`
	StartDate   time.Time `json:"startDate"`   // date of the first occurrence
	Interval    string    `json:"interval"`    // daily, weekly, monthly, yearly
	Occurrences int       `json:"occurrences"` // 0 for 3000 occurrences (heuristic)
}

type BackendType string

const (
	BackendTypeJSON     BackendType = "json"
	BackendTypePostgres BackendType = "postgres"
)

// config for the storage backend
type SystemConfig struct {
	StorageURL  string
	StorageType BackendType
	StorageUser string
	StoragePass string
	StorageSSL  string
}

// expense struct
type Expense struct {
	ID          string    `json:"id"`
	RecurringID string    `json:"recurringID"`
	Name        string    `json:"name"`
	Tags        []string  `json:"tags"`
	Category    string    `json:"category"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	Date        time.Time `json:"date"`
}

// UserDefaults represents the structure of user-defaults.json
type UserDefaults struct {
	Categories []string `json:"categories"`
	Currency   string   `json:"currency"`
	StartDate  int      `json:"startDate"`
	Theme      string   `json:"theme"`
}

// LoadUserDefaults reads user-defaults.json from the root directory
func LoadUserDefaults() (*UserDefaults, error) {
	// Try to find user-defaults.json in the current directory or parent directories
	paths := []string{
		"user-defaults.json",
		"../user-defaults.json",
		"../../user-defaults.json",
	}

	var data []byte
	var err error
	found := false

	for _, path := range paths {
		data, err = os.ReadFile(path)
		if err == nil {
			found = true
			break
		}
	}

	// If not found in any of those paths, return nil (will use hardcoded defaults)
	if !found {
		return nil, nil
	}

	var defaults UserDefaults
	if err := json.Unmarshal(data, &defaults); err != nil {
		return nil, fmt.Errorf("failed to parse user-defaults.json: %w", err)
	}

	return &defaults, nil
}

func (c *Config) SetBaseConfig() {
	// Try to load user defaults from JSON file
	userDefaults, err := LoadUserDefaults()

	if err == nil && userDefaults != nil {
		// Use user-provided defaults
		if len(userDefaults.Categories) > 0 {
			c.Categories = userDefaults.Categories
		} else {
			c.Categories = defaultCategories
		}

		if userDefaults.Currency != "" {
			c.Currency = userDefaults.Currency
		} else {
			c.Currency = "usd"
		}

		if userDefaults.StartDate >= 1 && userDefaults.StartDate <= 31 {
			c.StartDate = userDefaults.StartDate
		} else {
			c.StartDate = 1
		}
	} else {
		// Fall back to hardcoded defaults
		c.Categories = defaultCategories
		c.Currency = "usd"
		c.StartDate = 1
	}

	c.RecurringExpenses = []RecurringExpense{}
}

func (c *SystemConfig) SetStorageConfig() {
	c.StorageType = backendTypeFromEnv(os.Getenv("STORAGE_TYPE"))
	c.StorageURL = backendURLFromEnv(os.Getenv("STORAGE_URL"))
	c.StorageSSL = backendSSLFromEnv(os.Getenv("STORAGE_SSL"))
	c.StorageUser = os.Getenv("STORAGE_USER")
	c.StoragePass = os.Getenv("STORAGE_PASS")
}

func backendTypeFromEnv(env string) BackendType {
	switch env {
	case "json":
		return BackendTypeJSON
	case "postgres":
		return BackendTypePostgres
	default:
		return BackendTypeJSON
	}
}

func backendURLFromEnv(env string) string {
	if env == "" {
		return "data"
	}
	return env
}

func backendSSLFromEnv(env string) string {
	switch env {
	case "disable", "require", "verify-full", "verify-ca":
		return env
	default:
		return "disable"
	}
}

// initializes the storage backend
func InitializeStorage() (Storage, error) {
	baseConfig := SystemConfig{}
	baseConfig.SetStorageConfig()
	switch baseConfig.StorageType {
	case BackendTypeJSON:
		return InitializeJsonStore(baseConfig)
	case BackendTypePostgres:
		return InitializePostgresStore(baseConfig)
	}
	return nil, fmt.Errorf("invalid data store: %s", baseConfig.StorageType)
}

var REInvalidChars *regexp.Regexp = regexp.MustCompile(`[^\p{L}\p{N}\s.,\-'_!"]`)
var RERepeatingSpaces *regexp.Regexp = regexp.MustCompile(`\s+`)

// allows readable chars like unicode, otherwise replaces with whitespace
func SanitizeString(s string) string {
	sanitized := REInvalidChars.ReplaceAllString(s, " ")
	sanitized = RERepeatingSpaces.ReplaceAllString(sanitized, " ")
	return strings.TrimSpace(sanitized)
}

func ValidateCategory(category string) (string, error) {
	sanitized := SanitizeString(category)
	if sanitized == "" {
		return "", fmt.Errorf("category name cannot be empty or contain only invalid characters")
	}
	return sanitized, nil
}

func (e *Expense) Validate() error {
	e.Name = SanitizeString(e.Name)
	if e.Name == "" {
		return fmt.Errorf("expense 'name' cannot be empty")
	}
	if e.Category == "" {
		return fmt.Errorf("expense 'category' cannot be empty")
	}
	if e.Amount == 0 {
		return fmt.Errorf("expense 'amount' cannot be 0")
	}
	if len(e.Tags) > 0 {
		var cleanedTags []string
		for _, tag := range e.Tags {
			sanitizedTag := SanitizeString(tag)
			if sanitizedTag != "" {
				cleanedTags = append(cleanedTags, sanitizedTag)
			}
		}
		e.Tags = cleanedTags
	}
	if e.Date.IsZero() {
		return fmt.Errorf("expense 'date' cannot be empty")
	}
	return nil
}

func (e *RecurringExpense) Validate() error {
	e.Name = SanitizeString(e.Name)
	if e.Name == "" {
		return fmt.Errorf("recurring expense 'name' cannot be empty")
	}
	if e.Category == "" {
		return fmt.Errorf("recurring expense 'category' cannot be empty")
	}
	if len(e.Tags) > 0 {
		var cleanedTags []string
		for _, tag := range e.Tags {
			sanitizedTag := SanitizeString(tag)
			if sanitizedTag != "" {
				cleanedTags = append(cleanedTags, sanitizedTag)
			}
		}
		e.Tags = cleanedTags
	}
	if e.Occurrences < 2 {
		return fmt.Errorf("at least 2 occurences required to recur")
	}
	if e.StartDate.IsZero() {
		return fmt.Errorf("start date for recurring expense must be specified")
	}
	validIntervals := map[string]bool{
		"daily":   true,
		"weekly":  true,
		"monthly": true,
		"yearly":  true,
	}
	if !validIntervals[e.Interval] {
		return fmt.Errorf("invalid interval: '%s'. Must be one of 'daily', 'weekly', 'monthly', or 'yearly'", e.Interval)
	}
	return nil
}

// variables
var defaultCategories = []string{
	"Food",
	"Groceries",
	"Travel",
	"Rent",
	"Utilities",
	"Entertainment",
	"Healthcare",
	"Shopping",
	"Miscellaneous",
	"Income",
}

var SupportedCurrencies = []string{
	"usd", // US Dollar
	"eur", // Euro
	"gbp", // British Pound
	"jpy", // Japanese Yen
	"cny", // Chinese Yuan
	"krw", // Korean Won
	"inr", // Indian Rupee
	"rub", // Russian Ruble
	"brl", // Brazilian Real
	"zar", // South African Rand
	"aed", // UAE Dirham
	"aud", // Australian Dollar
	"cad", // Canadian Dollar
	"chf", // Swiss Franc
	"hkd", // Hong Kong Dollar
	"bdt", // Bangladeshi Taka
	"sgd", // Singapore Dollar
	"thb", // Thai Baht
	"try", // Turkish Lira
	"mxn", // Mexican Peso
	"php", // Philippine Peso
	"pln", // Polish Złoty
	"sek", // Swedish Krona
	"nzd", // New Zealand Dollar
	"dkk", // Danish Krone
	"idr", // Indonesian Rupiah
	"ils", // Israeli New Shekel
	"vnd", // Vietnamese Dong
	"myr", // Malaysian Ringgit
	"mad", // Moroccan Dirham
}
