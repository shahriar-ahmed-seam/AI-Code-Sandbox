package sandbox

import (
	"encoding/base64"
	"fmt"

	"github.com/ai-code-sandbox/sandbox/internal/langs"
)

const Workspace = "/workspace"

const (
	EnvCode  = "SANDBOX_CODE_B64"
	EnvStdin = "SANDBOX_STDIN_B64"
)

func buildEntrypoint(l langs.Language) []string {
	script := fmt.Sprintf(
		`set -e
cd %[1]s
printf '%%s' "$%[2]s" | base64 -d > %[3]s
printf '%%s' "$%[4]s" | base64 -d > .stdin 2>/dev/null || : > .stdin
%[5]s < .stdin`,
		Workspace, EnvCode, l.Filename, EnvStdin, l.RunCmd,
	)
	return []string{"sh", "-c", script}
}

func buildEnv(code, stdin string) []string {
	return []string{
		EnvCode + "=" + base64.StdEncoding.EncodeToString([]byte(code)),
		EnvStdin + "=" + base64.StdEncoding.EncodeToString([]byte(stdin)),
		"HOME=" + Workspace,
	}
}
