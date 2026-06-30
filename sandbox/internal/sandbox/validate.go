package sandbox

import (
	"errors"
	"strings"

	"github.com/ai-code-sandbox/sandbox/internal/langs"
)

const MaxCodeBytes = 64 * 1024

var (
	ErrEmptyCode    = errors.New("code must not be empty")
	ErrCodeTooLarge = errors.New("code exceeds maximum size")
)

func (req *RunRequest) Validate() error {
	req.Language = strings.ToLower(strings.TrimSpace(req.Language))
	if req.Language == "" {
		return ErrUnsupportedLanguage
	}
	if _, ok := langs.Get(req.Language); !ok {
		return ErrUnsupportedLanguage
	}
	if strings.TrimSpace(req.Code) == "" {
		return ErrEmptyCode
	}
	if len(req.Code) > MaxCodeBytes {
		return ErrCodeTooLarge
	}
	return nil
}
