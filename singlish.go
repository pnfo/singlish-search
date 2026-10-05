// Package singlish finds the Sinhala words a Singlish (Sinhala typed with English letters) query could stand for.
// It is the Go port of singlish.js and gives the same matches in the same order.
package singlish

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"regexp"
	"slices"
	"strings"
)

// sinhala unicode -> easy singlish
var singlishVowels = [][2]string{
	{"අ", "a"},
	{"ආ", "a, aa"},
	{"ඇ", "ae"},
	{"ඈ", "ae, aee"},
	{"ඉ", "i"},
	{"ඊ", "i, ii"},
	{"උ", "u"},
	{"ඌ", "u, uu"},
	{"එ", "e"},
	{"ඒ", "e, ee"},
	{"ඔ", "o"},
	{"ඕ", "o, oo"},
	{"ඓ", "ai"}, // sinhala only begin
	{"ඖ", "ou"},
	{"ඍ", "ru"},
	{"ඎ", "ru, ruu"},
}

var singlishSpecials = [][2]string{
	{"ඞ්", "n"},
	{"ං", "n, m"},
}

var singlishConsonants = [][2]string{
	{"ක", "k"},
	{"ග", "g"},
	{"ච", "c, ch"},
	{"ජ", "j"},
	{"ට", "t"},
	{"ඩ", "d"},
	{"ණ", "n"},
	{"ත", "th"},
	{"ද", "d"},
	{"න", "n"},
	{"ප", "p"},
	{"බ", "b"},
	{"ම", "m"},
	{"ය", "y"},
	{"ර", "r"},
	{"ල", "l"},
	{"ව", "v, w"},
	{"ශ", "sh"},
	{"ෂ", "sh"},
	{"ස", "s"},
	{"හ", "h"},
	{"ළ", "l"},
	{"ෆ", "f"},

	{"ඛ", "kh, k"},
	{"ඤ", "n, kn"},
	{"ඨ", "t"},
	{"ඝ", "gh"},
	{"ඟ", "ng"},
	{"ඡ", "ch"},
	{"ඣ", "jh"},
	{"ඦ", "nj"},
	{"ඪ", "dh"},
	{"ඬ", "nd"},
	{"ථ", "th"},
	{"ධ", "dh"},
	{"ඳ", "nd"},
	{"ඵ", "ph"},
	{"භ", "bh"},
	{"ඹ", "mb"},
	{"ඥ", "gn"}, // sinhala only
}

// sinh after, roman after
var singlishCombinations = [][2]string{
	{"්", ""},      //ක්
	{"", "a"},      //ක
	{"ා", "a, aa"}, //කා
	{"ැ", "ae"},
	{"ෑ", "ae, aee"},
	{"ි", "i"},
	{"ී", "i, ii"},
	{"ු", "u"},
	{"ූ", "u, uu"},
	{"ෙ", "e"},
	{"ේ", "e, ee"},
	{"ෛ", "ei"},
	{"ො", "o"},
	{"ෝ", "o, oo"},

	// following rakar/yansa patterns are aslo needed due to words like ග්රෑම/න්යාස which occur without rakar/yansa
	{"්\u200Dර", "ra"},       //ක්‍ර
	{"්\u200Dරා", "ra, raa"}, //ක්‍රා
	{"්\u200Dරැ", "rae"},
	{"්\u200Dරෑ", "rae, raee"},
	{"්\u200Dරි", "ri"},
	{"්\u200Dරී", "ri, rii"},
	{"්\u200Dරෙ", "re"},
	{"්\u200Dරේ", "re, ree"},
	{"්\u200Dරෛ", "rei"},
	{"්\u200Dරො", "ro"},
	{"්\u200Dරෝ", "ro, roo"},

	{"්\u200Dය", "ya"},       //ක්‍ය
	{"්\u200Dයා", "ya, yaa"}, //ක්‍යා
	{"්\u200Dයැ", "yae"},
	{"්\u200Dයෑ", "yae, yaee"},
	{"්\u200Dයි", "yi"},
	{"්\u200Dයී", "yi, yii"},
	{"්\u200Dයු", "yu"},
	{"්\u200Dයූ", "yu, yuu"},
	{"්\u200Dයෙ", "ye"},
	{"්\u200Dයේ", "ye, yee"},
	{"්\u200Dයෛ", "yei"},
	{"්\u200Dයො", "yo"},
	{"්\u200Dයෝ", "yo, yoo"},

	{"ෘ", "ru"}, // sinhala only begin
	{"ෲ", "ru, ruu"},
	{"ෞ", "au"},
}

type mapping struct {
	sinh  string
	runes []rune
	bits  float64 // extra cost of a shortcut spelling e.g. i for ී (instead of ii)
}

// singlish -> list of mappings, in the same order as singlish.js
var singlishMapping = map[string][]mapping{}
var maxSinglishKeyLen = 0

const shortcutBits = 1

func splitRomans(s string) []string {
	romans := strings.Split(s, ",")
	for i, r := range romans {
		romans[i] = strings.TrimSpace(r)
	}
	return romans
}

func shortcut(r string, list []string) float64 {
	for _, l := range list {
		if len(r) < len(l) {
			return 1
		}
	}
	return 0
}

func addToSinglishMapping(values [][2]string, pSinhStr, pRomanStr string) {
	pRomans := splitRomans(pRomanStr)
	for _, pair := range values {
		sinh := pair[0] + pSinhStr
		romans := splitRomans(pair[1])
		for _, roman := range romans {
			for _, pRoman := range pRomans {
				mapIndex := roman + pRoman
				bits := shortcutBits * (shortcut(roman, romans) + shortcut(pRoman, pRomans))
				if _, ok := singlishMapping[mapIndex]; !ok {
					maxSinglishKeyLen = max(len(mapIndex), maxSinglishKeyLen)
				}
				singlishMapping[mapIndex] = append(singlishMapping[mapIndex], mapping{sinh, []rune(sinh), bits})
			}
		}
	}
}

// reduce the number of matches by removing letter sequences that do not occur in sinhala - same as the matchFilters
// regexes in singlish.js, written out because the regexp package is slow here (singlish_test.go checks they agree)
func filtered(runes []rune) bool {
	isVowel := func(r rune) bool { return 'අ' <= r && r <= 'ඖ' } // independent vowels
	for i := 0; i+1 < len(runes); i++ {
		r, next := runes[i], runes[i+1]
		switch {
		// hal followed by හ - occur by mis identification of kh, gh, ch, jh, th, dh, ph, bh, sh as two letters
		// except ක්හට, ක්හි, ක්හු, ස්හි, ස්හු that are common in old sinhala e.g. යමක්හට, දවස්හි
		case next == '්' && i+2 < len(runes) && runes[i+2] == 'හ' && strings.ContainsRune("ඛගචජටඨඩදපබ", r):
			return true
		case next == '්' && i+3 < len(runes) && runes[i+2] == 'හ' && (r == 'ක' || r == 'ස') && !strings.ContainsRune("ටිු", runes[i+3]):
			return true
		// consecutive independent vowels
		case isVowel(r) && isVowel(next):
			return true
		// hal/n followed by a indept vowel (this occurs in words like ගල්අඟුරු but rare)
		case (r == '්' || r == 'ං') && isVowel(next):
			return true
		}
	}
	return false
}

// sinhala letter n-gram model built from sinhala corpora - used to rank the matches by how likely they occur in sinhala
//
//go:embed singlish-model.js
var modelSource string

var model struct {
	Order    int      `json:"order"`
	BitsStep float64  `json:"bitsStep"`
	Symbols  string   `json:"symbols"`
	Letters  string   `json:"letters"`
	Data     []string `json:"data"`
}

// letterBits[k] maps a context of k letters to a map of next letter -> -log2 probability
// a context is packed into a uint64 (contextKey) so that the lookups do not allocate
var letterBits []map[uint64]map[rune]float64

// context is the last order-1 letters of a match
type context struct {
	key uint64 // the letters packed 21 bits each, the last letter in the lowest bits
	n   int
}

func (c context) add(letter rune) context {
	n := min(c.n+1, model.Order-1)
	return context{(c.key<<21 | uint64(letter)) & (1<<(21*n) - 1), n}
}

// the last k letters
func (c context) last(k int) uint64 { return c.key & (1<<(21*k) - 1) }

var wordStart = context{'^', 1}

// extra bits when backing off from k letter context - bigrams are not pruned so an unseen bigram is very unlikely
var backoffBits = []float64{20, 12, 2}

// parses the generated singlish-model.js - one "key: json value," line per field
func loadModel() {
	fields := map[string]json.RawMessage{}
	for _, m := range regexp.MustCompile(`(?m)^\t(\w+): (.*),$`).FindAllStringSubmatch(modelSource, -1) {
		fields[m[1]] = json.RawMessage(m[2])
	}
	b, _ := json.Marshal(fields)
	if err := json.Unmarshal(b, &model); err != nil || model.Order < 2 || model.Order > 4 || len(model.Data) != model.Order {
		panic(fmt.Sprintf("singlish: can not parse singlish-model.js: %v", err))
	}

	letters := []rune(model.Letters)
	letterOf := func(sym byte) rune { return letters[strings.IndexByte(model.Symbols, sym)] }
	for k, line := range model.Data {
		contexts := map[uint64]map[rune]float64{}
		for _, group := range strings.Split(line, " ") {
			next := map[rune]float64{}
			for i := k; i+1 < len(group); i += 2 {
				next[letterOf(group[i])] = float64(strings.IndexByte(model.Symbols, group[i+1])) * model.BitsStep
			}
			c := context{}
			for i := 0; i < k && i < len(group); i++ {
				c.key = c.key<<21 | uint64(letterOf(group[i]))
			}
			contexts[c.key] = next
		}
		letterBits = append(letterBits, contexts)
	}
}

func init() {
	addToSinglishMapping(singlishVowels, "", "")
	addToSinglishMapping(singlishSpecials, "", "")
	for _, combi := range singlishCombinations {
		addToSinglishMapping(singlishConsonants, combi[0], combi[1])
	}
	loadModel()
}

func getLetterBits(c context, letter rune) float64 {
	bits := 0.0
	for k := c.n; k >= 0; k-- {
		if next, ok := letterBits[k][c.last(k)]; ok {
			if b, ok := next[letter]; ok {
				return bits + b
			}
		}
		bits += backoffBits[min(k, len(backoffBits)-1)]
	}
	return bits
}

type partial struct {
	match   string
	context context
	cost    float64 // -log2 probability of the match
}

// add the sinhala string to the match and update the cost
func extendMatch(p partial, sinh string, bits float64) partial {
	cost, c := p.cost+bits, p.context
	for _, letter := range sinh {
		if letter == '\u200D' {
			continue // zwj in rakar/yansa is not in the model
		}
		if _, ok := letterBits[0][0][letter]; ok {
			cost += getLetterBits(c, letter)
			c = c.add(letter)
		} else {
			c = wordStart // space, dot etc start a new word
		}
	}
	return partial{p.match + sinh, c, cost}
}

// beam keeps the partial matches in insertion order like a js Map, so that ties are ranked the same as singlish.js
type beam struct {
	partials []partial
	index    map[string]int
}

func (b *beam) add(p partial) {
	if i, ok := b.index[p.match]; ok {
		if b.partials[i].cost > p.cost {
			b.partials[i] = p
		}
		return
	}
	b.index[p.match] = len(b.partials)
	b.partials = append(b.partials, p)
}

// sorts by cost (stable) and returns at most n partials
func (b *beam) best(n int) []partial {
	slices.SortStableFunc(b.partials, func(x, y partial) int {
		switch {
		case x.cost < y.cost:
			return -1
		case x.cost > y.cost:
			return 1
		}
		return 0
	})
	return b.partials[:min(n, len(b.partials))]
}

// DefaultMaxMatches is the number of matches returned by GetPossibleMatches.
const DefaultMaxMatches = 300

// the beam keeps the work linear in the input length, this only guards against very long inputs
const maxInputLength = 30

// GetPossibleMatches returns at most DefaultMaxMatches Sinhala matches for the Singlish input,
// ranked by how likely they occur in Sinhala (most likely first).
// Sinhala letters in the input are kept as they are, so Sinhala and Singlish can be mixed.
func GetPossibleMatches(input string) []string {
	return GetPossibleMatchesN(input, DefaultMaxMatches)
}

// GetPossibleMatchesN is GetPossibleMatches returning at most maxMatches matches.
func GetPossibleMatchesN(input string, maxMatches int) []string {
	in := []rune(input)
	if len(in) > maxInputLength {
		return []string{input}
	}
	beamWidth := max(2*maxMatches, 100) // number of partial matches kept at each input position

	// left to right beam search - beams[pos] has the partial matches for in[:pos]
	beams := make([]beam, len(in)+1)
	for i := range beams {
		beams[i].index = map[string]int{}
	}
	beams[0].add(partial{"", wordStart, 0})
	var runes []rune // tail of the partial match followed by the mapping, to check the filters
	for pos := range in {
		partials := beams[pos].best(beamWidth)
		for l := 1; l <= maxSinglishKeyLen && pos+l <= len(in); l++ {
			prefix := string(in[pos : pos+l])
			// if prefix is all sinhala then pass through the prefix - this allows sinhala and singlish mixing and ending dot
			var mappings []mapping
			if IsSinglishQuery(prefix) {
				mappings = singlishMapping[prefix]
			} else if l == 1 {
				mappings = []mapping{{prefix, []rune(prefix), 0}}
			}
			if mappings == nil {
				continue
			}
			b := &beams[pos+l]
			for _, p := range partials {
				runes = append(runes[:0], []rune(lastRunes(p.match, 3))...) // longest filter is 4 letters
				tail := len(runes)
				for _, m := range mappings {
					if runes = append(runes[:tail], m.runes...); filtered(runes) {
						continue
					}
					b.add(extendMatch(p, m.sinh, m.bits))
				}
			}
		}
	}
	best := beams[len(in)].best(max(maxMatches, 0))
	matches := make([]string, len(best))
	for i, p := range best {
		matches[i] = p.match
	}
	return matches
}

func lastRunes(s string, n int) string {
	i := len(s)
	for ; n > 0 && i > 0; n-- {
		i--
		for i > 0 && s[i]&0xC0 == 0x80 {
			i--
		}
	}
	return s[i:]
}

// IsSinglishQuery reports whether the query has any English letters.
func IsSinglishQuery(query string) bool {
	return strings.ContainsFunc(query, func(r rune) bool { return 'A' <= r && r <= 'Z' || 'a' <= r && r <= 'z' })
}
