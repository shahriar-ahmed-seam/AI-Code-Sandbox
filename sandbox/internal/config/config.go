package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	ListenAddr string

	MaxMemoryMB    int64
	MaxCPUs        float64
	MaxPids        int64
	DefaultTimeout time.Duration
	MaxTimeout     time.Duration

	WorkspaceBytes int64

	MaxConcurrency int

	ReapInterval time.Duration

	PullOnBoot bool
}

const (
	LabelKey   = "ai-sandbox"
	LabelValue = "true"
)

func Load() Config {
	return Config{
		ListenAddr:     getEnv("LISTEN_ADDR", ":8090"),
		MaxMemoryMB:    getInt64("MAX_MEMORY_MB", 512),
		MaxCPUs:        getFloat("MAX_CPUS", 1.5),
		MaxPids:        getInt64("MAX_PIDS", 128),
		DefaultTimeout: time.Duration(getInt64("DEFAULT_TIMEOUT_MS", 8000)) * time.Millisecond,
		MaxTimeout:     time.Duration(getInt64("MAX_TIMEOUT_MS", 20000)) * time.Millisecond,
		WorkspaceBytes: getInt64("WORKSPACE_MB", 64) * 1024 * 1024,
		MaxConcurrency: int(getInt64("MAX_CONCURRENCY", 8)),
		ReapInterval:   time.Duration(getInt64("REAP_INTERVAL_S", 60)) * time.Second,
		PullOnBoot:     getBool("PULL_ON_BOOT", false),
	}
}

func (c Config) ClampTimeout(requestedMs int64) time.Duration {
	if requestedMs <= 0 {
		return c.DefaultTimeout
	}
	d := time.Duration(requestedMs) * time.Millisecond
	if d > c.MaxTimeout {
		return c.MaxTimeout
	}
	return d
}

func getEnv(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func getInt64(key string, def int64) int64 {
	if v, ok := os.LookupEnv(key); ok {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			return n
		}
	}
	return def
}

func getFloat(key string, def float64) float64 {
	if v, ok := os.LookupEnv(key); ok {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return def
}

func getBool(key string, def bool) bool {
	if v, ok := os.LookupEnv(key); ok {
		if b, err := strconv.ParseBool(v); err == nil {
			return b
		}
	}
	return def
}
