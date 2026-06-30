package sandbox

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"sync"
	"time"

	"github.com/ai-code-sandbox/sandbox/internal/config"
	"github.com/ai-code-sandbox/sandbox/internal/langs"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

var ErrUnsupportedLanguage = errors.New("unsupported language")

type Runner struct {
	cli *client.Client
	cfg config.Config
	log *slog.Logger
	sem chan struct{}
}

var ErrBusy = errors.New("runner at capacity")

func NewRunner(cfg config.Config, log *slog.Logger) (*Runner, error) {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("docker client: %w", err)
	}
	return &Runner{
		cli: cli,
		cfg: cfg,
		log: log,
		sem: make(chan struct{}, cfg.MaxConcurrency),
	}, nil
}

func (r *Runner) Ping(ctx context.Context) error {
	_, err := r.cli.Ping(ctx)
	return err
}

func (r *Runner) Acquire() (release func(), err error) {
	select {
	case r.sem <- struct{}{}:
		return func() { <-r.sem }, nil
	default:
		return nil, ErrBusy
	}
}

func (r *Runner) Run(ctx context.Context, jobID string, req RunRequest) (RunResponse, error) {
	lang, ok := langs.Get(req.Language)
	if !ok {
		return RunResponse{}, ErrUnsupportedLanguage
	}

	timeout := r.cfg.ClampTimeout(req.TimeoutMs)
	resp := RunResponse{JobID: jobID, Language: lang.ID}

	hostCfg := r.hardenedHostConfig()
	containerCfg := &container.Config{
		Image:           lang.Image,
		Entrypoint:      buildEntrypoint(lang),
		Env:             append(buildEnv(req.Code, req.Stdin), goEnv()...),
		WorkingDir:      Workspace,
		User:            "65534:65534",
		NetworkDisabled: true,
		Tty:             false,
		Labels: map[string]string{
			config.LabelKey: config.LabelValue,
			"job_id":        jobID,
		},
	}

	created, err := r.cli.ContainerCreate(ctx, containerCfg, hostCfg, nil, nil, "sbx_"+jobID)
	if err != nil {
		return resp, fmt.Errorf("container create: %w", err)
	}
	cid := created.ID

	defer r.cleanup(cid)

	start := time.Now()
	if err := r.cli.ContainerStart(ctx, cid, container.StartOptions{}); err != nil {
		return resp, fmt.Errorf("container start: %w", err)
	}

	memCtx, memCancel := context.WithCancel(ctx)
	defer memCancel()
	peakMem := r.trackMemory(memCtx, cid)

	waitCtx, waitCancel := context.WithTimeout(ctx, timeout)
	defer waitCancel()

	statusCh, errCh := r.cli.ContainerWait(waitCtx, cid, container.WaitConditionNotRunning)

	select {
	case <-waitCtx.Done():
		killCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_ = r.cli.ContainerKill(killCtx, cid, "SIGKILL")
		cancel()
		resp.TimedOut = true
		resp.Status = StatusTimeout
		resp.ExitCode = 137
	case waitErr := <-errCh:
		if waitErr != nil {
			resp.Status = StatusError
			resp.Stderr = "execution supervisor error"
			r.log.Error("container wait", "job", jobID, "err", waitErr)
		}
	case st := <-statusCh:
		resp.ExitCode = int(st.StatusCode)
		resp.Status = StatusCompleted
	}

	resp.DurationMs = time.Since(start).Milliseconds()
	memCancel()
	resp.MemoryKB = peakMem() / 1024

	stdout, stderr := r.collectLogs(ctx, cid)
	resp.Stdout = stdout
	if resp.Stderr == "" {
		resp.Stderr = stderr
	} else if stderr != "" {
		resp.Stderr = resp.Stderr + "\n" + stderr
	}

	if insp, ierr := r.cli.ContainerInspect(ctx, cid); ierr == nil && insp.State != nil {
		if insp.State.OOMKilled {
			resp.OOMKilled = true
			if resp.Status == StatusCompleted {
				resp.Status = StatusError
			}
		}
	}

	return resp, nil
}

func (r *Runner) hardenedHostConfig() *container.HostConfig {
	pids := r.cfg.MaxPids
	memBytes := r.cfg.MaxMemoryMB * 1024 * 1024
	tmpfsOpts := fmt.Sprintf("rw,exec,nosuid,size=%d,mode=1777", r.cfg.WorkspaceBytes)

	return &container.HostConfig{
		NetworkMode:    "none",
		ReadonlyRootfs: true,
		AutoRemove:     false,
		CapDrop:        []string{"ALL"},
		SecurityOpt:    []string{"no-new-privileges:true"},
		Tmpfs: map[string]string{
			Workspace: tmpfsOpts,
			"/tmp":    fmt.Sprintf("rw,nosuid,size=%d,mode=1777", r.cfg.WorkspaceBytes),
		},
		Resources: container.Resources{
			Memory:     memBytes,
			MemorySwap: memBytes,
			NanoCPUs:   int64(r.cfg.MaxCPUs * 1e9),
			PidsLimit:  &pids,
		},
	}
}

func goEnv() []string {
	return []string{
		"GOCACHE=" + Workspace + "/.cache",
		"GOPATH=" + Workspace + "/go",
		"GOTMPDIR=" + Workspace,
		"GO111MODULE=off",
	}
}

func (r *Runner) collectLogs(ctx context.Context, cid string) (string, string) {
	reader, err := r.cli.ContainerLogs(ctx, cid, container.LogsOptions{
		ShowStdout: true,
		ShowStderr: true,
	})
	if err != nil {
		return "", ""
	}
	defer reader.Close()

	var outBuf, errBuf bytes.Buffer
	if _, err := stdcopy.StdCopy(&outBuf, &errBuf, reader); err != nil && err != io.EOF {
		r.log.Debug("log demux", "err", err)
	}
	return truncate(outBuf.String()), truncate(errBuf.String())
}

const maxOutputBytes = 256 * 1024

func truncate(s string) string {
	if len(s) <= maxOutputBytes {
		return s
	}
	return s[:maxOutputBytes] + "\n[output truncated]"
}

func (r *Runner) trackMemory(ctx context.Context, cid string) func() int64 {
	var mu sync.Mutex
	var peak int64

	go func() {
		stats, err := r.cli.ContainerStats(ctx, cid, true)
		if err != nil {
			return
		}
		defer stats.Body.Close()

		dec := bufio.NewReader(stats.Body)
		for {
			line, err := dec.ReadBytes('\n')
			if len(line) > 0 {
				var s struct {
					MemoryStats struct {
						Usage    uint64 `json:"usage"`
						MaxUsage uint64 `json:"max_usage"`
					} `json:"memory_stats"`
				}
				if json.Unmarshal(line, &s) == nil {
					v := int64(s.MemoryStats.MaxUsage)
					if int64(s.MemoryStats.Usage) > v {
						v = int64(s.MemoryStats.Usage)
					}
					mu.Lock()
					if v > peak {
						peak = v
					}
					mu.Unlock()
				}
			}
			if err != nil {
				return
			}
		}
	}()

	return func() int64 {
		mu.Lock()
		defer mu.Unlock()
		return peak
	}
}

func (r *Runner) cleanup(cid string) {
	for attempt := 0; attempt < 2; attempt++ {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		err := r.cli.ContainerRemove(ctx, cid, container.RemoveOptions{Force: true})
		cancel()
		if err == nil || client.IsErrNotFound(err) {
			return
		}
		r.log.Warn("container cleanup failed, retrying", "cid", cid, "attempt", attempt, "err", err)
		time.Sleep(500 * time.Millisecond)
	}
	r.log.Error("container cleanup ultimately failed; reaper will retry", "cid", cid)
}

func orphanFilter() filters.Args {
	f := filters.NewArgs()
	f.Add("label", config.LabelKey+"="+config.LabelValue)
	return f
}
