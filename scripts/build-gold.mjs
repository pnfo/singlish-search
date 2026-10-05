// build gold (singlish, sinhala) pairs from the word lists made by extract-corpus.mjs
// each word gets two singlish spellings
//   strict - long vowels doubled as defined in singlish.js (aa, ii, uu, ee, oo, aee)
//   lazy - long vowels typed short (a, i, u, e, o, ae) as many users do
// output data/gold.tsv with lines of "slice\tfreq\tsinhala\tstrict\tlazy"
import fs from 'node:fs'

const dataDir = new URL('../data/', import.meta.url).pathname
const sliceSizes = { headings: 5000, text: 5000, dict: 2000 } // dict words are sampled randomly (freq is meaningless)
const maxRomanLength = 20 // getPossibleMatches passes through longer inputs

// the usual roman for each consonant (first choice in singlish.js except ච)
const consonants = {
	'ක': 'k', 'ග': 'g', 'ච': 'ch', 'ජ': 'j', 'ට': 't', 'ඩ': 'd', 'ණ': 'n', 'ත': 'th', 'ද': 'd', 'න': 'n',
	'ප': 'p', 'බ': 'b', 'ම': 'm', 'ය': 'y', 'ර': 'r', 'ල': 'l', 'ව': 'v', 'ශ': 'sh', 'ෂ': 'sh', 'ස': 's',
	'හ': 'h', 'ළ': 'l', 'ෆ': 'f', 'ඛ': 'kh', 'ඤ': 'kn', 'ඨ': 't', 'ඝ': 'gh', 'ඟ': 'ng', 'ඡ': 'ch', 'ඣ': 'jh',
	'ඦ': 'nj', 'ඪ': 'dh', 'ඬ': 'nd', 'ථ': 'th', 'ධ': 'dh', 'ඳ': 'nd', 'ඵ': 'ph', 'භ': 'bh', 'ඹ': 'mb', 'ඥ': 'gn',
}
// [strict, lazy]
const vowels = {
	'අ': ['a', 'a'], 'ආ': ['aa', 'a'], 'ඇ': ['ae', 'ae'], 'ඈ': ['aee', 'ae'], 'ඉ': ['i', 'i'], 'ඊ': ['ii', 'i'],
	'උ': ['u', 'u'], 'ඌ': ['uu', 'u'], 'එ': ['e', 'e'], 'ඒ': ['ee', 'e'], 'ඔ': ['o', 'o'], 'ඕ': ['oo', 'o'],
	'ඓ': ['ai', 'ai'], 'ඖ': ['ou', 'ou'], 'ඍ': ['ru', 'ru'], 'ඎ': ['ruu', 'ru'],
}
const signs = {
	'': ['a', 'a'], '්': ['', ''], 'ා': ['aa', 'a'], 'ැ': ['ae', 'ae'], 'ෑ': ['aee', 'ae'], 'ි': ['i', 'i'],
	'ී': ['ii', 'i'], 'ු': ['u', 'u'], 'ූ': ['uu', 'u'], 'ෙ': ['e', 'e'], 'ේ': ['ee', 'e'], 'ෛ': ['ei', 'ei'],
	'ො': ['o', 'o'], 'ෝ': ['oo', 'o'], 'ෘ': ['ru', 'ru'], 'ෲ': ['ruu', 'ru'], 'ෞ': ['au', 'au'],
}
const tokenRe = new RegExp(`([${Object.keys(consonants).join('')}])(්‍[රය])?([${Object.keys(signs).join('')}]?)|([${Object.keys(vowels).join('')}])|(ං|ඞ්)`, 'y')

export function sinhalaToSinglish(word) {
	const out = ['', '']
	tokenRe.lastIndex = 0
	while (tokenRe.lastIndex < word.length) {
		const m = tokenRe.exec(word)
		if (!m) return null // unsupported letter
		const [, cons, rakYan, sign, vowel, special] = m
		if (cons) {
			const rest = rakYan ? (rakYan[2] == 'ර' ? 'r' : 'y') : ''
			signs[sign].forEach((s, i) => out[i] += consonants[cons] + rest + s)
		} else if (vowel) {
			vowels[vowel].forEach((v, i) => out[i] += v)
		} else {
			out[0] += 'n'; out[1] += 'n'
		}
	}
	return out
}

function seededRandom(seed) {
	return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

if (import.meta.url == `file://${process.argv[1]}`) {
	const rows = []
	for (const [slice, size] of Object.entries(sliceSizes)) {
		let words = fs.readFileSync(`${dataDir}${slice}.tsv`, 'utf8').trim().split('\n').map(l => l.split('\t'))
		if (slice == 'dict') {
			const rand = seededRandom(42)
			words = words.map(w => [w, rand()]).sort((a, b) => a[1] - b[1]).map(w => w[0])
		}
		let count = 0
		for (const [word, freq] of words) {
			if (count >= size) break
			const roman = sinhalaToSinglish(word)
			if (!roman || roman[0].length < 3 || roman[0].length > maxRomanLength) continue
			rows.push([slice, freq, word, ...roman].join('\t'))
			count++
		}
		console.log(`${slice}: ${count} gold words`)
	}
	fs.writeFileSync(`${dataDir}gold.tsv`, rows.join('\n') + '\n')
}
