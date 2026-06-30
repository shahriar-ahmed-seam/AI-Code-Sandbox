package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ai-code-sandbox/sandbox/internal/config"
	"github.com/ai-code-sandbox/sandbox/internal/sandbox"
	"github.com/ai-code-sandbox/sandbox/internal/server"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	cfg := config.Load()

	runner, err := sandbox.NewRunner(cfg, log)
	if err != nil {
		log.Error("failed to init runner", "err", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	runner.StartReaper(ctx, cfg.ReapInterval)

	srv := &http.Server{
		Addr:              cfg.ListenAddr,
		Handler:           server.New(runner, log).Handler(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Info("sandbox runner listening", "addr", cfg.ListenAddr,
			"max_mem_mb", cfg.MaxMemoryMB, "max_cpus", cfg.MaxCPUs,
			"max_pids", cfg.MaxPids, "max_concurrency", cfg.MaxConcurrency)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	log.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
	runner.ReapOnce(context.Background())
}
