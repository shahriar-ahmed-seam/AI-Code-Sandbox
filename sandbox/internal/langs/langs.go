package langs

type Language struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Version  string `json:"version"`
	Image    string `json:"-"`
	Filename string `json:"-"`
	RunCmd   string `json:"-"`
}

var registry = map[string]Language{
	"python": {
		ID:       "python",
		Name:     "Python",
		Version:  "3.12",
		Image:    "ai-sandbox-python:latest",
		Filename: "main.py",
		RunCmd:   "python main.py",
	},
	"node": {
		ID:       "node",
		Name:     "Node.js",
		Version:  "20",
		Image:    "ai-sandbox-node:latest",
		Filename: "main.js",
		RunCmd:   "node main.js",
	},
	"go": {
		ID:       "go",
		Name:     "Go",
		Version:  "1.22",
		Image:    "ai-sandbox-go:latest",
		Filename: "main.go",
		RunCmd:   `mkdir -p "$GOCACHE" && cp -a /opt/gocache/. "$GOCACHE"/ 2>/dev/null; go run main.go`,
	},
}

func Get(id string) (Language, bool) {
	l, ok := registry[id]
	return l, ok
}

func All() []Language {
	out := make([]Language, 0, len(registry))
	for _, l := range registry {
		out = append(out, l)
	}
	return out
}

func Images() []string {
	seen := map[string]bool{}
	var out []string
	for _, l := range registry {
		if !seen[l.Image] {
			seen[l.Image] = true
			out = append(out, l.Image)
		}
	}
	return out
}
