// compare singlish-search versions on the gold set made by build-gold.mjs
// usage: node scripts/eval.mjs [--lost=baseline,version] [--rules]
//   --lost  list gold words found by baseline but missed by version (default 1.2.5,new)
//   --rules count corpus words that the match filters in singlish.js would remove
import fs from 'node:fs'

const dataDir = new URL('../data/', import.meta.url).pathname
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')))
const usableLimit = 300 // arutha.lk rejects queries with more matches than this

const log = console.log
console.log = () => {} // silence 'singlish map initialized'
const versions = {
	'1.2.5': (await import('singlish-v125')).getPossibleMatches,
	'1.2.7': (await import('singlish-v127')).getPossibleMatches,
	'head': (await import(`${dataDir}singlish-head.js`)).getPossibleMatches,
	'new': (await import('../singlish.js')).getPossibleMatches,
}
console.log = log

const gold = fs.readFileSync(`${dataDir}gold.tsv`, 'utf8').trim().split('\n').map(l => {
	const [slice, freq, word, strict, lazy] = l.split('\t')
	return { slice, freq: +freq, word, strict, lazy }
})

const results = {} // version -> form -> [{ g, hit, count }]
for (const [name, getMatches] of Object.entries(versions)) {
	results[name] = {}
	for (const form of ['strict', 'lazy']) {
		const start = Date.now()
		results[name][form] = gold.map(g => {
			try {
				const matches = getMatches(g[form])
				return { g, hit: matches.includes(g.word), count: matches.length }
			} catch { // call stack exceeded on huge match lists - counted as an unusable explosion
				return { g, hit: false, count: Infinity }
			}
		})
		results[name][form].ms = Date.now() - start
	}
}

const pct = (n, d) => (100 * n / d).toFixed(1).padStart(5)
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
function summarize(rows) {
	const counts = rows.map(r => r.count).filter(isFinite).sort((a, b) => a - b), errors = rows.length - counts.length
	return [
		pct(rows.filter(r => r.hit).length, rows.length),
		pct(rows.filter(r => r.hit && r.count <= usableLimit).length, rows.length),
		(counts.reduce((a, c) => a + c, 0) / counts.length).toFixed(0).padStart(6),
		String(quantile(counts, 0.5)).padStart(5), String(quantile(counts, 0.95)).padStart(6), String(counts.at(-1)).padStart(7),
		pct(counts.filter(c => c > usableLimit).length + errors, rows.length), String(errors).padStart(4),
	].join(' ')
}

log(`gold: ${gold.length} words. recall = gold word in matches, usable = recall with <= ${usableLimit} matches`)
for (const form of ['strict', 'lazy']) {
	log(`\n== ${form} spelling`)
	log('version slice     recall usable   mean   p50    p95     max  >300  err time')
	for (const name of Object.keys(versions)) {
		const all = results[name][form]
		for (const slice of ['headings', 'text', 'dict', 'all']) {
			const rows = slice == 'all' ? all : all.filter(r => r.g.slice == slice)
			log(`${name.padEnd(7)} ${slice.padEnd(9)} ${summarize(rows)}${slice == 'all' ? ` ${all.ms}ms` : ''}`)
		}
	}
}

const [base, cand] = (args.lost || '1.2.5,new').split(',')
for (const form of ['strict', 'lazy']) {
	const lost = results[cand][form].filter((r, i) => !r.hit && results[base][form][i].hit)
	const gained = results[cand][form].filter((r, i) => r.hit && !results[base][form][i].hit)
	log(`\n${form}: ${cand} loses ${lost.length} and gains ${gained.length} gold words compared with ${base}`)
	lost.sort((a, b) => b.g.freq - a.g.freq).slice(0, 25)
		.forEach(r => log(`  - ${r.g.slice.padEnd(8)} ${String(r.g.freq).padStart(6)} ${r.g[form].padEnd(20)} ${r.g.word}`))
}

if ('rules' in args) {
	const { matchFilters } = await import('../singlish.js')
	const corpus = ['text', 'dict', 'headings'].flatMap(slice => fs.readFileSync(`${dataDir}${slice}.tsv`, 'utf8').trim().split('\n')
		.map(l => { const [word, freq] = l.split('\t'); return { slice, word, freq: +freq } }))
	log(`\ncorpus words removed by each filter (out of ${corpus.length})`)
	for (const [label, re] of Object.entries(matchFilters)) {
		const hits = corpus.filter(c => re.test(c.word)).sort((a, b) => b.freq - a.freq)
		log(`${label}: ${hits.length} words, total freq ${hits.reduce((a, h) => a + h.freq, 0)}`)
		hits.slice(0, 12).forEach(h => log(`  ${h.slice.padEnd(8)} ${String(h.freq).padStart(6)} ${h.word}`))
	}
}
