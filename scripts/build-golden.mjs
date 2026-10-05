// write the golden fixtures that the go port is tested against (go test ./...), so that the js and go versions can not drift apart
// rerun after changing singlish.js, singlish-model.js or roman_convert.js
// usage: node scripts/build-golden.mjs [--sample=400] [--out=testdata]
//   sample - take every nth gold word (data/gold.tsv), --sample=1 with --out=<scratch dir> checks all of them
import fs from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')))
const sample = +(args.sample || 400)
const outDir = new URL(`../${args.out || 'testdata'}/`, import.meta.url).pathname
const dataDir = new URL('../data/', import.meta.url).pathname

const log = console.log
console.log = () => {} // silence 'singlish map initialized'
const { getPossibleMatches } = await import('../singlish.js')
const { romanToSinhalaConvert, sinhalaToRomanConvert, genTestPattern } = await import('../roman_convert.js')
console.log = log

const gold = fs.readFileSync(`${dataDir}gold.tsv`, 'utf8').trim().split('\n').map(l => l.split('\t'))
	.filter((_, i) => i % sample == 0)

// queries from the tests, edge cases, then the strict and lazy singlish of the sampled gold words
const queries = [...new Set([
	'nirvana', 'janadhipathi', 'janadhipathivaranaya', 'shasthraya', 'sankhyava', 'dharmaya', 'kotaheena', 'kotahena',
	'yamakhata', 'davashi', 'siddhaartha', 'prathipaththi', 'bhikkhu', 'samanthabhadra', 'gedara', 'vahanse', 'himi',
	'aknknamaknknadukan', 'ආනන්ද මෛත්‍රී hiමි', 'ආනන්ද මෛත්‍රී හිමියන් ගේ ගන්දබ්බ්', 'නිර්වාන', 'buddha.', 'sutta pitaka',
	'Nirvana', 'a', 'x', '', 'ruu', 'kn', 'q', 'nirvana123', 'අnanda',
	...gold.flatMap(([, , , strict, lazy]) => [strict, lazy]),
])]
const singlish = { maxMatches: {}, matches: {} }
for (const q of queries) singlish.matches[q] = getPossibleMatches(q)
for (const n of [0, 1, 10, 100]) singlish.maxMatches[n] = getPossibleMatches('janadhipathivaranaya', { maxMatches: n })

// sinhala words and their roman, plus roman spellings that only convert one way
const words = [genTestPattern(), 'බුද්ධ ජයන්ති ත්‍රිපිටකය', 'ප්‍රඥා', 'සංඛ්‍යාව', 'ග්රෑම', 'නිර්වාණ 123.', ...gold.map(g => g[2])]
const toRoman = Object.fromEntries(words.map(w => [w, sinhalaToRomanConvert(w)]))
const romans = [...Object.values(toRoman), 'tipiṭaka'.normalize('NFD'), '\uF826da \uF826ga ṉda ṉga', 'kṛşi', 'BUDDHA Ṣa Æ', 'Saṃyutta Nikāya', 'aai kaau']
const toSinhala = Object.fromEntries(romans.map(r => [r, romanToSinhalaConvert(r)]))

fs.mkdirSync(outDir, { recursive: true })
// one query per line keeps the diffs readable
const lines = obj => '{\n' + Object.entries(obj).map(([k, v]) => `\t${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n}'
fs.writeFileSync(`${outDir}singlish.json`, `{\n"maxMatches": ${lines(singlish.maxMatches)},\n"matches": ${lines(singlish.matches)}\n}\n`)
fs.writeFileSync(`${outDir}roman.json`, `{\n"toRoman": ${lines(toRoman)},\n"toSinhala": ${lines(toSinhala)}\n}\n`)
console.log(`${queries.length} singlish queries, ${words.length} sinhala and ${romans.length} roman texts written to ${outDir}`)
