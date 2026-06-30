package config

import (
	"testing"
	"time"
)

func TestClampTimeout(t *testing.T) {
	c := Config{DefaultTimeout: 5 * time.Second, MaxTimeout: 15 * time.Second}

	cases := []struct {
		name string
		in   int64
		want time.Duration
	}{
		{"zero uses default", 0, 5 * time.Second},
		{"negative uses default", -100, 5 * time.Second},
		{"within bounds", 8000, 8 * time.Second},
		{"over max clamps", 999999, 15 * time.Second},
		{"exactly max", 15000, 15 * time.Second},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := c.ClampTimeout(tc.in); got != tc.want {
				t.Fatalf("ClampTimeout(%d) = %v, want %v", tc.in, got, tc.want)
			}
		})
	}
}

func TestLoadDefaults(t *testing.T) {
	c := Load()
	if c.MaxMemoryMB <= 0 || c.MaxCPUs <= 0 || c.MaxPids <= 0 {
		t.Fatalf("expected positive resource defaults, got %+v", c)
	}
	if c.MaxConcurrency <= 0 {
		t.Fatalf("expected positive concurrency, got %d", c.MaxConcurrency)
	}
	if c.MaxTimeout < c.DefaultTimeout {
		t.Fatalf("max timeout %v must be >= default %v", c.MaxTimeout, c.DefaultTimeout)
	}
}
