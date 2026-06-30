package sandbox

import (
	"encoding/base64"
	"strings"
	"testing"

	"github.com/ai-code-sandbox/sandbox/internal/langs"
)

func TestValidate(t *testing.T) {
	cases := []struct {
		name    string
		req     RunRequest
		wantErr error
	}{
		{"ok", RunRequest{Language: "python", Code: "print(1)"}, nil},
		{"normalizes case", RunRequest{Language: "  PYTHON ", Code: "print(1)"}, nil},
		{"empty lang", RunRequest{Language: "", Code: "x"}, ErrUnsupportedLanguage},
		{"unknown lang", RunRequest{Language: "cobol", Code: "x"}, ErrUnsupportedLanguage},
		{"empty code", RunRequest{Language: "python", Code: "   "}, ErrEmptyCode},
		{"too large", RunRequest{Language: "python", Code: strings.Repeat("a", MaxCodeBytes+1)}, ErrCodeTooLarge},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := tc.req
			err := req.Validate()
			if err != tc.wantErr {
				t.Fatalf("Validate() = %v, want %v", err, tc.wantErr)
			}
		})
	}
}

func TestBuildEntrypointDecodesAndRuns(t *testing.T) {
	l, _ := langs.Get("python")
	ep := buildEntrypoint(l)

	if len(ep) != 3 || ep[0] != "sh" || ep[1] != "-c" {
		t.Fatalf("expected [sh -c <script>], got %v", ep)
	}
	script := ep[2]
	for _, want := range []string{Workspace, EnvCode, l.Filename, "base64 -d", l.RunCmd, "< .stdin"} {
		if !strings.Contains(script, want) {
			t.Fatalf("entrypoint script missing %q\nscript:\n%s", want, script)
		}
	}
}

func TestBuildEnvEncodesPayload(t *testing.T) {
	code := "print('hi')"
	stdin := "42\n"
	env := buildEnv(code, stdin)

	wantCode := EnvCode + "=" + base64.StdEncoding.EncodeToString([]byte(code))
	wantStdin := EnvStdin + "=" + base64.StdEncoding.EncodeToString([]byte(stdin))

	if !contains(env, wantCode) {
		t.Fatalf("env missing encoded code; got %v", env)
	}
	if !contains(env, wantStdin) {
		t.Fatalf("env missing encoded stdin; got %v", env)
	}
}

func contains(ss []string, target string) bool {
	for _, s := range ss {
		if s == target {
			return true
		}
	}
	return false
}
