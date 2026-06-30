package langs

import "testing"

func TestGetKnown(t *testing.T) {
	for _, id := range []string{"python", "node", "go"} {
		l, ok := Get(id)
		if !ok {
			t.Fatalf("expected language %q to exist", id)
		}
		if l.Image == "" || l.Filename == "" || l.RunCmd == "" {
			t.Fatalf("language %q is missing fields: %+v", id, l)
		}
	}
}

func TestGetUnknown(t *testing.T) {
	if _, ok := Get("brainfuck"); ok {
		t.Fatal("did not expect brainfuck to be supported")
	}
}

func TestAllAndImages(t *testing.T) {
	if len(All()) < 3 {
		t.Fatalf("expected at least 3 languages, got %d", len(All()))
	}
	if len(Images()) < 3 {
		t.Fatalf("expected at least 3 distinct images, got %d", len(Images()))
	}
}
