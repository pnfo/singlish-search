// extract sinhala word frequency lists from the local tipitaka.lk / arutha.lk / file-server-v2 databases
// output (gitignored) data/{text,dict,headings}.tsv with lines of "word\tfreq" sorted by freq desc
// usage: node scripts/extract-corpus.mjs [path to the folder containing the sibling projects]
import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || new URL('../../..', import.meta.url).pathname)
const outDir = new URL('../data/', import.meta.url).pathname
fs.mkdirSync(outDir, { recursive: true })

const sources = {
	text: [ // running text - pali and sinhala in sinhala script
		['tipitaka.lk/db/text.db', 'SELECT p_text AS t FROM entry UNION ALL SELECT s_text FROM entry WHERE s_text IS NOT NULL UNION ALL SELECT text FROM footnote'],
	],
	dict: [ // dictionary headwords
		['tipitaka.lk/db/dict.db', 'SELECT DISTINCT word AS t FROM dictionary'],
		...['sinhala_to_english', 'sankshiptha', 'akshara_vinyasa', 'pali_buddhadatta', 'pali_sumangala']
			.map(table => ['arutha.lk/server-data/all-dict.db', `SELECT word AS t FROM ${table}`]),
	],
	headings: [ // what users actually search for - sutta names and book titles/authors
		['tipitaka.lk/db/text.db', 'SELECT pali AS t FROM node UNION ALL SELECT sinh FROM node'],
		['file-server-v2/data/library.db', 'SELECT name AS t FROM entries UNION ALL SELECT author FROM entries WHERE author IS NOT NULL'],
	],
}
const titleIndexFile = 'tipitaka.app-old/static/json/title-search-index.json' // mula + atta sutta names

// sinhala letters with zwj (rakar/yansa), leading/trailing zwj removed
const wordsOf = text => (text.match(/[඀-෿‍]+/g) || []).map(w => w.replace(/^‍+|‍+$/g, '')).filter(w => w.length > 1)

for (const [slice, list] of Object.entries(sources)) {
	const freq = new Map()
	const add = text => wordsOf(text || '').forEach(w => freq.set(w, (freq.get(w) || 0) + 1))
	for (const [file, sql] of list) {
		const db = new DatabaseSync(path.join(root, file), { readOnly: true })
		for (const row of db.prepare(sql).iterate()) add(row.t)
		db.close()
	}
	if (slice == 'headings') JSON.parse(fs.readFileSync(path.join(root, titleIndexFile), 'utf8')).forEach(r => add(r[1]))

	const lines = [...freq].sort((a, b) => b[1] - a[1]).map(([w, f]) => `${w}\t${f}`)
	fs.writeFileSync(path.join(outDir, `${slice}.tsv`), lines.join('\n') + '\n')
	console.log(`${slice}: ${freq.size} unique words`)
}
