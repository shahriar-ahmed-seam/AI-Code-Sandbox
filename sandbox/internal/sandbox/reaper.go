package sandbox

import (
	"context"
	"time"

	"github.com/docker/docker/api/types/container"
)

func (r *Runner) ReapOnce(ctx context.Context) int {
	list, err := r.cli.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: orphanFilter(),
	})
	if err != nil {
		r.log.Warn("reaper list failed", "err", err)
		return 0
	}

	removed := 0
	for _, c := range list {
		rmCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
		err := r.cli.ContainerRemove(rmCtx, c.ID, container.RemoveOptions{Force: true})
		cancel()
		if err == nil {
			removed++
		} else {
			r.log.Warn("reaper remove failed", "cid", c.ID, "err", err)
		}
	}
	if removed > 0 {
		r.log.Info("reaped orphaned containers", "count", removed)
	}
	return removed
}

func (r *Runner) StartReaper(ctx context.Context, interval time.Duration) {
	r.ReapOnce(ctx)
	ticker := time.NewTicker(interval)
	go func() {
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				r.ReapOnce(ctx)
			}
		}
	}()
}
