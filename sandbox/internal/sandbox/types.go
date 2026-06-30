package sandbox

type RunRequest struct {
	Language  string `json:"language"`
	Code      string `json:"code"`
	Stdin     string `json:"stdin"`
	TimeoutMs int64  `json:"timeout_ms"`
}

const (
	StatusCompleted = "completed"
	StatusTimeout   = "timeout"
	StatusError     = "error"
)

type RunResponse struct {
	JobID      string `json:"job_id"`
	Language   string `json:"language"`
	Stdout     string `json:"stdout"`
	Stderr     string `json:"stderr"`
	ExitCode   int    `json:"exit_code"`
	DurationMs int64  `json:"duration_ms"`
	MemoryKB   int64  `json:"memory_kb"`
	TimedOut   bool   `json:"timed_out"`
	OOMKilled  bool   `json:"oom_killed"`
	Status     string `json:"status"`
}
