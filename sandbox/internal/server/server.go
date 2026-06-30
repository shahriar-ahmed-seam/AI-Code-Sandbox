package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/ai-code-sandbox/sandbox/internal/sandbox"
)

type Server struct {
	runner *sandbox.Runner
	log    *slog.Logger
}

func New(runner *sandbox.Runner, log *slog.Logger) *Server {
	return &Server{runner: runner, log: log}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.handleHealth)
	mux.HandleFunc("POST /run", s.handleRun)
	return mux
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	if err := s.runner.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "unavailable",
			"detail": "docker daemon unreachable",
		})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleRun(w http.ResponseWriter, r *http.Request) {
	var req sandbox.RunRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, errResp("invalid JSON body"))
		return
	}

	if err := req.Validate(); err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, sandbox.ErrCodeTooLarge) {
			status = http.StatusRequestEntityTooLarge
		}
		writeJSON(w, status, errResp(err.Error()))
		return
	}

	release, err := s.runner.Acquire()
	if err != nil {
		writeJSON(w, http.StatusTooManyRequests, errResp("runner at capacity, retry shortly"))
		return
	}
	defer release()

	jobID := newJobID()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	resp, err := s.runner.Run(ctx, jobID, req)
	if err != nil {
		if errors.Is(err, sandbox.ErrUnsupportedLanguage) {
			writeJSON(w, http.StatusBadRequest, errResp(err.Error()))
			return
		}
		s.log.Error("job failed", "job", jobID, "lang", req.Language, "err", err)
		writeJSON(w, http.StatusInternalServerError, errResp("execution failed"))
		return
	}

	s.log.Info("job done",
		"job", jobID,
		"lang", resp.Language,
		"status", resp.Status,
		"exit", resp.ExitCode,
		"duration_ms", resp.DurationMs,
		"timed_out", resp.TimedOut,
		"oom", resp.OOMKilled,
	)
	writeJSON(w, http.StatusOK, resp)
}

func newJobID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func errResp(msg string) map[string]string { return map[string]string{"error": msg} }

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
