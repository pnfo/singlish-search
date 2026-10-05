package roman

import (
	"encoding/json"
	"os"
	"strings"
	"testing"

	"golang.org/x/text/unicode/norm"
)

// golden fixtures written by the js version (scripts/build-golden.mjs)
func TestGolden(t *testing.T) {
	dir := os.Getenv("SINGLISH_GOLDEN_DIR")
	if dir == "" {
		dir = "../testdata"
	}
	var golden struct{ ToRoman, ToSinhala map[string]string }
	b, err := os.ReadFile(dir + "/roman.json")
	if err == nil {
		err = json.Unmarshal(b, &golden)
	}
	if err != nil {
		t.Fatal(err)
	}
	for sinh, want := range golden.ToRoman {
		if got := FromSinhala(sinh); got != want {
			t.Errorf("FromSinhala(%q) = %q, js gives %q", sinh, got, want)
		}
	}
	for roman, want := range golden.ToSinhala {
		if got := ToSinhala(roman); got != want {
			t.Errorf("ToSinhala(%q) = %q, js gives %q", roman, got, want)
		}
	}
}

// the tests below are from roman_convert.test.js

// all the letter combinations that convert both ways
func testPattern() string {
	var sb strings.Builder
	for _, list := range sortedMappings[1] {
		for _, m := range list {
			sb.WriteString(m.to + " ")
		}
	}
	return sb.String()
}

func TestRoundTrip(t *testing.T) {
	words := strings.Fields(testPattern())
	words = append(words, "දණ්ඩ", "පණ්ඩිත", "අම්බර", "සම්බුද්ධ", "භුඤ්ජති", "අග්නි", "ප්\u200Dරඥා", "කණ්ඩය", "සඳ", "අඹ", "ගඟ")
	for _, w := range words {
		if got := ToSinhala(FromSinhala(w)); got != w {
			t.Errorf("round trip %s (%s) gives %s", w, FromSinhala(w), got)
		}
	}
}

func TestConvert(t *testing.T) {
	for in, want := range map[string]string{
		"buddha jayanti tripiṭakaya": "බුද්ධ ජයන්ති ත්\u200Dරිපිටකය",
		norm.NFD.String("tipiṭaka"):  "තිපිටක",
		"\uF826da \uF826ga ṉda ṉga":  "ඳ ඟ ඳ ඟ",
		"kṛşi":                       "කෘෂි",
	} {
		if got := ToSinhala(in); got != want {
			t.Errorf("ToSinhala(%q) = %s, want %s", in, got, want)
		}
	}
	for in, want := range map[string]string{
		"බුද්ධ ජයන්ති ත්\u200Dරිපිටකය": "buddha jayanti tripiṭakaya",
		"ඬ ඹ ඦ ඳ ඟ ඥ ෂ ඇ ඈ ඒ ඕ ෆ":      "n̆ḍa m̆ba n̆ja n̆da n̆ga jña ṣa æ ǣ ē ō fa",
	} {
		if got := FromSinhala(in); got != want {
			t.Errorf("FromSinhala(%s) = %s, want %s", in, got, want)
		}
	}
}

func BenchmarkFromSinhala(b *testing.B) {
	text := strings.Repeat("බුද්ධ ජයන්ති ත්\u200Dරිපිටකය ", 100)
	for b.Loop() {
		FromSinhala(text)
	}
}
