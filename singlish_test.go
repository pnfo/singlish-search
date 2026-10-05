package singlish

import (
	"encoding/json"
	"os"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"testing"
)

// golden fixtures written by the js version (scripts/build-golden.mjs)
// SINGLISH_GOLDEN_DIR points to fixtures made with --sample=1 to check all the gold words
func readGolden(t *testing.T, name string, v any) {
	dir := os.Getenv("SINGLISH_GOLDEN_DIR")
	if dir == "" {
		dir = "testdata"
	}
	b, err := os.ReadFile(dir + "/" + name)
	if err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(b, v); err != nil {
		t.Fatal(err)
	}
}

func TestGolden(t *testing.T) {
	var golden struct {
		MaxMatches map[string][]string `json:"maxMatches"`
		Matches    map[string][]string `json:"matches"`
	}
	readGolden(t, "singlish.json", &golden)
	for q, want := range golden.Matches {
		if got := GetPossibleMatches(q); !slices.Equal(got, want) {
			t.Errorf("GetPossibleMatches(%q) differs from js\n got %d %.10q\nwant %d %.10q", q, len(got), got, len(want), want)
		}
	}
	for n, want := range golden.MaxMatches {
		maxMatches, _ := strconv.Atoi(n)
		if got := GetPossibleMatchesN("janadhipathivaranaya", maxMatches); !slices.Equal(got, want) {
			t.Errorf("GetPossibleMatchesN(%d) differs from js\n got %.10q\nwant %.10q", maxMatches, got, want)
		}
	}
}

// the tests below are from singlish.test.js

func TestIsSinglishQuery(t *testing.T) {
	if !IsSinglishQuery("nirvana") || IsSinglishQuery("නිර්වාන") || !IsSinglishQuery("නිර්වානnir") {
		t.Error("IsSinglishQuery")
	}
}

func TestMatches(t *testing.T) {
	contains := func(q string, maxMatches int, want ...string) {
		t.Helper()
		got := GetPossibleMatchesN(q, maxMatches)
		for _, w := range want {
			if !slices.Contains(got, w) {
				t.Errorf("%s: %s not in the first %d matches", q, w, maxMatches)
			}
		}
	}
	contains("nirvana", 300, "නිර්වාන", "නිර්වාණ", "ණිර්වණ", "නිර්වානා")
	contains("shasthraya", 300, "ශාස්ත්\u200Dරය")
	contains("sankhyava", 300, "සංඛ්\u200Dයාව", "සංඛ්යාව", "සාඞ්ඛ්\u200Dයවා")
	contains("vahanse", 10, "වහන්සේ")
	contains("bhikkhu", 10, "භික්ඛූ")
	for q, w := range map[string]string{
		"dharmaya": "ධර්මය", "kotaheena": "කොටහේන", "yamakhata": "යමක්හට", "davashi": "දවස්හි",
		"siddhaartha": "සිද්ධාර්ථ", "prathipaththi": "ප්\u200Dරතිපත්ති", "bhikkhu": "භික්ඛු", "janadhipathi": "ජනාධිපති",
	} {
		contains(q, 300, w)
	}
	if got := GetPossibleMatches("nirvana")[:3]; !slices.Contains(got, "නිර්වාණ") {
		t.Errorf("nirvana ranked %q", got)
	}
}

func TestRanking(t *testing.T) {
	for q, want := range map[string]string{
		"janadhipathivaranaya": "ජනාධිපතිවරණය", "samanthabhadra": "සමන්තභද්\u200Dර", "gedara": "ගෙදර",
		"ආනන්ද මෛත්\u200Dරී hiමි": "ආනන්ද මෛත්\u200Dරී හිමි",
	} {
		if got := GetPossibleMatches(q)[0]; got != want {
			t.Errorf("%s: got %s first, want %s", q, got, want)
		}
	}
	if n := len(GetPossibleMatches("janadhipathivaranaya")); n != 300 {
		t.Errorf("got %d matches", n)
	}
	if n := len(GetPossibleMatchesN("janadhipathivaranaya", 10)); n != 10 {
		t.Errorf("got %d matches", n)
	}
}

func TestLength(t *testing.T) {
	long := "ආනන්ද මෛත්\u200Dරී හිමියන් ගේ ගන්දබ්බ්"
	if got := GetPossibleMatches(long); !slices.Equal(got, []string{long}) {
		t.Errorf("got %q", got)
	}
}

func TestFilters(t *testing.T) {
	for _, m := range GetPossibleMatches("dharmaya") {
		if strings.Contains(m, "ද්හ") || strings.Contains(m, "ඩ්හ") {
			t.Errorf("aspirate split %s", m)
		}
	}
	halVowel := regexp.MustCompile(`්[ඔඑ]`)
	for _, m := range GetPossibleMatches("kotahena") {
		if halVowel.MatchString(m) {
			t.Errorf("hal followed by independent vowel %s", m)
		}
	}
}

// the matchFilters regexes from singlish.js
var matchFilter = regexp.MustCompile(`[ඛගචජටඨඩදපබ]්හ|[කස]්හ[^ටිු]|[අ-ඖ][අ-ඖ]|[්ං][අ-ඖ]`)

func TestFiltered(t *testing.T) {
	letters := []rune("ඛගබකසතහ්ංටිුඉඅඖඕා. a")
	var check func(runes []rune)
	check = func(runes []rune) {
		if want := matchFilter.MatchString(string(runes)); filtered(runes) != want {
			t.Errorf("filtered(%s) = %v", string(runes), !want)
		}
		if len(runes) < 4 { // the longest filter is 4 letters
			for _, r := range letters {
				check(append(runes, r))
			}
		}
	}
	check(nil)
}

func BenchmarkGetPossibleMatches(b *testing.B) {
	for b.Loop() {
		GetPossibleMatches("janadhipathivaranaya")
	}
}
