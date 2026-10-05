// Package roman converts Sinhala text to the equivalent Roman transliteration (IAST, and ISO 15919 for the
// Sinhala only letters) and vice versa. It is the Go port of roman_convert.js and gives the same output.
package roman

import (
	"slices"
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// sinhala unicode, roman, optional one-way direction (0 sinhala -> roman only, 1 roman -> sinhala only)
type pair struct {
	sinh, roman string
	oneWay      int // -1 for both directions
}

var roSpecials = []pair{
	/* VOWELS */
	{"ඓ", "ai", -1}, // sinhala only begin - only kai and ai occurs in reality
	{"ඖ", "au", -1}, // ambiguous conversions e.g. k+au = ka+u = kau, a+u = au but only kau and au occurs in reality
	{"ඍ", "ṛ", -1},
	{"ඎ", "ṝ", -1},
	{"ඐ", "ḹ", -1}, // sinhala only end

	{"අ", "a", -1},
	{"ආ", "ā", -1},
	{"ඇ", "æ", -1}, {"ඇ", "Æ", 1},
	{"ඈ", "ǣ", -1},
	{"ඉ", "i", -1},
	{"ඊ", "ī", -1},
	{"උ", "u", -1},
	{"ඌ", "ū", -1},
	{"එ", "e", -1},
	{"ඒ", "ē", -1},
	{"ඔ", "o", -1},
	{"ඕ", "ō", -1},

	/* SPECIALS */
	{"ඞ්", "ṅ", -1},               // not used in combi
	{"ං", "ṃ", -1}, {"ං", "ṁ", 1}, // IAST, use both
	{"ඃ", "ḥ", -1}, {"ඃ", "Ḥ", 1}, // sinhala only
}

// iast, and iso 15919 for the sinhala only letters (prenasals use a breve e.g. n̆d)
// one-way (roman -> sinhala only) mappings accept older spellings,  (private use) marks the prenasals in some old texts
var roConsonants = []pair{
	{"ඛ", "kh", -1},
	{"ඨ", "ṭh", -1},
	{"ඝ", "gh", -1},
	{"ඡ", "ch", -1},
	{"ඣ", "jh", -1},
	{"ඦ", "n̆j", -1}, // non pali
	{"ඪ", "ḍh", -1},
	{"ඬ", "n̆ḍ", -1}, {"ඬ", "\uF826dh", 1}, // non pali
	{"ථ", "th", -1},
	{"ධ", "dh", -1},
	{"ඵ", "ph", -1},
	{"භ", "bh", -1},
	{"ඹ", "m̆b", -1},                                      // non pali
	{"ඳ", "n̆d", -1}, {"ඳ", "ṉd", 1}, {"ඳ", "\uF826d", 1}, // non pali
	{"ඟ", "n̆g", -1}, {"ඟ", "ṉg", 1}, {"ඟ", "\uF826g", 1}, // non pali
	{"ඥ", "jñ", -1}, // non pali

	{"ක", "k", -1},
	{"ග", "g", -1},
	{"ච", "c", -1},
	{"ජ", "j", -1},
	{"ඤ", "ñ", -1},
	{"ට", "ṭ", -1},
	{"ඩ", "ḍ", -1},
	{"ණ", "ṇ", -1},
	{"ත", "t", -1},
	{"ද", "d", -1},
	{"න", "n", -1},
	{"ප", "p", -1},
	{"බ", "b", -1},
	{"ම", "m", -1},
	{"ය", "y", -1},
	{"ර", "r", -1},
	{"ල", "l", -1},
	{"ව", "v", -1},
	{"ශ", "ś", -1},
	{"ෂ", "ṣ", -1}, {"ෂ", "Ṣ", 1}, {"ෂ", "ş", 1},
	{"ස", "s", -1},
	{"හ", "h", -1},
	{"ළ", "ḷ", -1},
	{"ෆ", "f", -1},
}

// roman after, sinh after
var roCombinations = [][2]string{
	{"", "්"},  //ක්
	{"a", ""},  //ක
	{"ā", "ා"}, //කා
	{"æ", "ැ"}, // non pali
	{"ǣ", "ෑ"}, // non pali
	{"i", "ි"},
	{"ī", "ී"},
	{"u", "ු"},
	{"ū", "ූ"},
	{"e", "ෙ"},
	{"ē", "ේ"},  // non pali
	{"ai", "ෛ"}, // non pali
	{"o", "ො"},
	{"ō", "ෝ"}, // non pali

	{"ṛ", "ෘ"}, // sinhala only begin
	{"ṝ", "ෲ"},
	{"au", "ෞ"},
	{"ḹ", "ෳ"}, // sinhala only end
}

// a mapping from one direction to the other, the from runes are case folded the same way as a js /i regex
type replacement struct {
	from   []rune
	to     string
	folded []rune // to, case folded
}

// longest first, so that e.g. kha is replaced before ka - sorted once for each direction (0 sinhala->roman, 1 roman->sinhala)
var sortedMappings [2][][]replacement

func init() {
	var consoCombi []pair // create permutations
	for _, combi := range roCombinations {
		for _, conso := range roConsonants {
			consoCombi = append(consoCombi, pair{conso.sinh + combi[1], conso.roman + combi[0], conso.oneWay})
		}
	}
	for dir := range 2 {
		for _, list := range [][]pair{consoCombi, roSpecials} {
			var reps []replacement
			for _, p := range list {
				if p.oneWay >= 0 && p.oneWay != dir { // one-way mappings
					continue
				}
				from, to := p.sinh, p.roman
				if dir == 1 {
					from, to = to, from
				}
				reps = append(reps, replacement{foldRunes([]rune(from)), to, foldRunes([]rune(to))})
			}
			slices.SortStableFunc(reps, func(a, b replacement) int { return len(b.from) - len(a.from) })
			sortedMappings[dir] = append(sortedMappings[dir], reps)
		}
	}
}

// ToSinhala converts Roman text to Sinhala, e.g. "buddha jayanti tripiṭakaya" -> "බුද්ධ ජයන්ති ත්‍රිපිටකය".
func ToSinhala(text string) string {
	text = genericConvert(norm.NFC.String(text), 1) // combining diacritics (e.g. from pdfs) to single letters
	// add zwj for yansa and rakaransa
	text = strings.ReplaceAll(text, "්ර", "්\u200Dර") // rakar
	return strings.ReplaceAll(text, "්ය", "්\u200Dය") // yansa
}

// FromSinhala converts Sinhala text to Roman, e.g. "බුද්ධ ජයන්ති ත්‍රිපිටකය" -> "buddha jayanti tripiṭakaya".
func FromSinhala(text string) string {
	// remove zwj since it does not occur in roman
	return genericConvert(strings.ReplaceAll(text, "\u200D", ""), 0)
}

// replaces the mappings one after the other like roman_convert.js, matching case insensitively
func genericConvert(text string, dir int) string {
	runes := []rune(text)
	folded := foldRunes(slices.Clone(runes))
	present := map[rune]bool{} // letters in the text, to skip the mappings that can not match
	for _, r := range folded {
		present[r] = true
	}
	for _, list := range sortedMappings[dir] {
		for _, m := range list {
			if present[m.from[0]] {
				runes, folded = replaceAll(runes, folded, m)
				for _, r := range m.folded {
					present[r] = true
				}
			}
		}
	}
	return string(runes)
}

func replaceAll(runes, folded []rune, m replacement) ([]rune, []rune) {
	i := index(folded, m.from, 0)
	if i < 0 {
		return runes, folded
	}
	to := []rune(m.to)
	var out []rune
	last := 0
	for ; i >= 0; i = index(folded, m.from, last) {
		out = append(append(out, runes[last:i]...), to...)
		last = i + len(m.from)
	}
	out = append(out, runes[last:]...)
	return out, foldRunes(slices.Clone(out))
}

func index(s, sub []rune, from int) int {
	for i := from; i+len(sub) <= len(s); i++ {
		if s[i] == sub[0] && slices.Equal(s[i:i+len(sub)], sub) {
			return i
		}
	}
	return -1
}

// case folds like the js regex /i flag (without /u): upper case, unless that maps a non ascii letter to ascii
func foldRunes(runes []rune) []rune {
	for i, r := range runes {
		if r < 0x10000 {
			if u := unicode.ToUpper(r); r < 128 || u >= 128 {
				runes[i] = u
			}
		}
	}
	return runes
}
