// sinhala unicode -> easy singlish
export const singlish_vowels = [
	['අ', 'a'],
	['ආ', 'aa'],
	['ඇ', 'ae'],
	['ඈ', 'ae, aee'],
	['ඉ', 'i'],
	['ඊ', 'ii'],
	['උ', 'u'],
	['ඌ', 'uu'],
	['එ', 'e'],
	['ඒ', 'ee'],
	['ඔ', 'o'],
	['ඕ', 'oo'],
	['ඓ', 'ai'], // sinhala only begin
	['ඖ', 'ou'],
	['ඍ', 'ru'],
	['ඎ', 'ru, ruu'],
	//['ඏ', 'li'], /** 2020-6-22 commented out some rare letters to prevent too many possibilites */
	//['ඐ', 'li, lii'] // sinhala only end
]

export const singlish_specials = [
	['ඞ්', 'n'],
	['ං', 'n'],
	//['ඃ', 'n, m'] // sinhala only
]

export const singlish_consonants = [
	['ක', 'k'],
	['ග', 'g'],
	['ච', 'c, ch'],
	['ජ', 'j'],
	['ට', 't'],
	['ඩ', 'd'],
	['ණ', 'n'],
	['ත', 'th'],
	['ද', 'd'],
	['න', 'n'],
	['ප', 'p'],
	['බ', 'b'],
	['ම', 'm'],
	['ය', 'y'],
	['ර', 'r'],
	['ල', 'l'],
	['ව', 'v, w'],
	['ශ', 'sh'],
	['ෂ', 'sh'],
	['ස', 's'],
	['හ', 'h'],
	['ළ', 'l'],
	['ෆ', 'f'],

	['ඛ', 'kh, k'],
	['ඤ', 'kn'],
	['ඨ', 't'],
	['ඝ', 'gh'],
	['ඟ', 'ng'],
	['ඡ', 'ch'],
	['ඣ', 'jh'],
	['ඦ', 'nj'],
	['ඪ', 'dh'],
	['ඬ', 'nd'],
	['ථ', 'th'],
	['ධ', 'dh'],
	['ඳ', 'nd'],
	['ඵ', 'ph'],
	['භ', 'bh'],
	['ඹ', 'mb'],
	['ඥ', 'gn'] // sinhala only
] 

// sinh before, sinh after, roman after
export const singlish_combinations = [
	['්', ''], //ක්
	['', 'a'], //ක
	['ා', 'a, aa'], //කා
	['ැ', 'ae'],
	['ෑ', 'aee'],
	['ි', 'i'],
	['ී', 'ii'],
	['ු', 'u'],
	['ූ', 'uu'],
	['ෙ', 'e'],
	['ේ', 'ee'],
	['ෛ', 'ei'],
	['ො', 'o'],
	['ෝ', 'oo'],

	['්‍ර', 'ra'], //ක්‍ර
	['්‍රා', 'ra, raa'], //ක්‍රා
	['්‍රැ', 'rae'],
	['්‍රෑ', 'rae, raee'],
	['්‍රි', 'ri'],
	['්‍රී', 'ri, rii'],
	['්‍රෙ', 're'],
	['්‍රේ', 're, ree'],
	['්‍රෛ', 'rei'],
	['්‍රො', 'ro'],
	['්‍රෝ', 'ro, roo'],

	['්‍ය', 'ya'], //ක්‍ය
	['්‍යා', 'ya, yaa'], //ක්‍යා
	['්‍යැ', 'yae'],
	['්‍යෑ', 'yae, yaee'],
	['්‍යි', 'yi'],
	['්‍යී', 'yi, yii'],
	['්‍යු', 'yu'],
	['්‍යූ', 'yu, yuu'],
	['්‍යෙ', 'ye'],
	['්‍යේ', 'ye, yee'],
	['්‍යෛ', 'yei'],
	['්‍යො', 'yo'],
	['්‍යෝ', 'yo, yoo'],

	['ෘ', 'ru'],  // sinhala only begin
	['ෲ', 'ru, ruu'],
	['ෞ', 'au'],
	//['ෟ', 'li'],
	//['ෳ', 'li, lii'] // sinhala only end
]

const singlishMapping = {}
let maxSinglishKeyLen = 0
function addToSinglishMapping(values, pSinhStr, pRomanStr) {
	values.forEach(pair => {
		const sinh = pair[0] + pSinhStr

		const romans = pair[1].split(',');
		const pRomans = pRomanStr.split(',');
		romans.forEach(roman => {
			pRomans.forEach(pRoman => {
				const mapIndex = roman.trim() + pRoman.trim()
				if (mapIndex in singlishMapping) {
					singlishMapping[mapIndex].push(sinh)
				} else {
					singlishMapping[mapIndex] = [sinh]
					maxSinglishKeyLen = Math.max(mapIndex.length, maxSinglishKeyLen)
				}
			})
		})
	})
}

addToSinglishMapping(singlish_vowels, '', '')
addToSinglishMapping(singlish_specials, '', '')
singlish_combinations.forEach(combi => {
	addToSinglishMapping(singlish_consonants, combi[0], combi[1]);
})
console.log(`singlish map initialized. maxSinglishKeyLen: ${maxSinglishKeyLen}`)

const maxInputLength = 20 // prevent call stack exceeding the stack size
export function getPossibleMatches(input) {
	if (input.length > maxInputLength) return [input]

	let matches = []
	for (let len = 1; len <= maxSinglishKeyLen && len <= input.length; len++) {
		const prefix = input.slice(0, len)
		const rest = input.slice(len)
		matches.push(...(permuteMatches(prefix, rest)))
	}
	// reduce the number of matches to prevent sql query from exploding 
	// 1) two consecutive hals (except in rakar/yansa) 
	// 2) consecutive independent vowels 
	// 3) hal/n followed by a indept vowel
	// that do not occur in sinhala
	matches = matches.filter(match => !(/[ක-ෆ]්[ක-ෆ]්[^\u200d]|[අ-ඎ][අ-ඎ]|[්ං][අ-ඎ]/.test(match)) )
	// further remove rare consonants to make the matches usable at least partially
	if (matches.length > 500) { 
		matches = matches.filter(match => !/[ඤඨඟඡඣඦඪඬඳඵඥ]/.test(match))
	}
	return matches
}

function permuteMatches(prefix, rest) {
	// if prefix is all sinhala then pass through the prefix - this allows sinhala and singlish mixing and ending dot
	const prefixMappings = isSinglishQuery(prefix) ? singlishMapping[prefix] : (prefix.length == 1 ? [prefix] : [])
	if (!prefixMappings) { // recursion ending condition
		return []
	}
	if (!rest.length) {  // recursion ending condition
		return prefixMappings
	}
	const restMappings = getPossibleMatches(rest);
	const fullMappings = []
	restMappings.forEach(restM =>
		prefixMappings.forEach(prefixM =>
			fullMappings.push(prefixM + restM)
		)
	)
	return fullMappings
}

export function isSinglishQuery(query) {
	return /[A-Za-z]/.test(query);
}
/*
[
        'ස්හස්ත්‍රය',   'ස්හාස්ත්‍රය',   'ස්හස්ථ්‍රය',   'ස්හාස්ථ්‍රය',
        'ස්හස්ත්‍රාය',  'ස්හාස්ත්‍රාය',  'ස්හස්ථ්‍රාය',  'ස්හාස්ථ්‍රාය',
        'ස්හස්ත්‍රයා',  'ස්හාස්ත්‍රයා',  'ස්හස්ථ්‍රයා',  'ස්හාස්ථ්‍රයා',
        'ස්හස්ත්‍රායා', 'ස්හාස්ත්‍රායා', 'ස්හස්ථ්‍රායා', 'ස්හාස්ථ්‍රායා',
        'ශස්ත්‍රය',    'ෂස්ත්‍රය',     'ශාස්ත්‍රය',   'ෂාස්ත්‍රය',
        'ශස්ථ්‍රය',    'ෂස්ථ්‍රය',     'ශාස්ථ්‍රය',   'ෂාස්ථ්‍රය',
        'ශස්ත්‍රාය',   'ෂස්ත්‍රාය',    'ශාස්ත්‍රාය',  'ෂාස්ත්‍රාය',
        'ශස්ථ්‍රාය',   'ෂස්ථ්‍රාය',    'ශාස්ථ්‍රාය',  'ෂාස්ථ්‍රාය',
        'ශස්ත්‍රයා',   'ෂස්ත්‍රයා',    'ශාස්ත්‍රයා',  'ෂාස්ත්‍රයා',
        'ශස්ථ්‍රයා',   'ෂස්ථ්‍රයා',    'ශාස්ථ්‍රයා',  'ෂාස්ථ්‍රයා',
        'ශස්ත්‍රායා',  'ෂස්ත්‍රායා',   'ශාස්ත්‍රායා', 'ෂාස්ත්‍රායා',
        'ශස්ථ්‍රායා',  'ෂස්ථ්‍රායා',   'ශාස්ථ්‍රායා', 'ෂාස්ථ්‍රායා'
      ]

'ජණඩ්හිපට්හිවරණය',    'ජාණඩ්හිපට්හිවරණය',    'ජනඩ්හිපට්හිවරණය',    'ජානඩ්හිපට්හිවරණය',
        'ජණාඩ්හිපට්හිවරණය',   'ජාණාඩ්හිපට්හිවරණය',   'ජනාඩ්හිපට්හිවරණය',   'ජානාඩ්හිපට්හිවරණය',
        'ජණද්හිපට්හිවරණය',    'ජාණද්හිපට්හිවරණය',    'ජනද්හිපට්හිවරණය',    'ජානද්හිපට්හිවරණය',
        'ජණාද්හිපට්හිවරණය',   'ජාණාද්හිපට්හිවරණය',   'ජනාද්හිපට්හිවරණය',   'ජානාද්හිපට්හිවරණය',
        'ජණඩ්හිපාට්හිවරණය',   'ජාණඩ්හිපාට්හිවරණය',   'ජනඩ්හිපාට්හිවරණය',   'ජානඩ්හිපාට්හිවරණය',
        'ජණාඩ්හිපාට්හිවරණය',  'ජාණාඩ්හිපාට්හිවරණය',  'ජනාඩ්හිපාට්හිවරණය',  'ජානාඩ්හිපාට්හිවරණය',
        'ජණද්හිපාට්හිවරණය',   'ජාණද්හිපාට්හිවරණය',   'ජනද්හිපාට්හිවරණය',   'ජානද්හිපාට්හිවරණය',
        'ජණාද්හිපාට්හිවරණය',  'ජාණාද්හිපාට්හිවරණය',  'ජනාද්හිපාට්හිවරණය',  'ජානාද්හිපාට්හිවරණය',
        'ජණඩ්හිපට්හිවාරණය',   'ජාණඩ්හිපට්හිවාරණය',   'ජනඩ්හිපට්හිවාරණය',   'ජානඩ්හිපට්හිවාරණය',
        'ජණාඩ්හිපට්හිවාරණය',  'ජාණාඩ්හිපට්හිවාරණය',  'ජනාඩ්හිපට්හිවාරණය',  'ජානාඩ්හිපට්හිවාරණය',
        'ජණද්හිපට්හිවාරණය',   'ජාණද්හිපට්හිවාරණය',   'ජනද්හිපට්හිවාරණය',   'ජානද්හිපට්හිවාරණය',
        'ජණාද්හිපට්හිවාරණය',  'ජාණාද්හිපට්හිවාරණය',  'ජනාද්හිපට්හිවාරණය',  'ජානාද්හිපට්හිවාරණය',
        'ජණඩ්හිපාට්හිවාරණය',  'ජාණඩ්හිපාට්හිවාරණය',  'ජනඩ්හිපාට්හිවාරණය',  'ජානඩ්හිපාට්හිවාරණය',
        'ජණාඩ්හිපාට්හිවාරණය', 'ජාණාඩ්හිපාට්හිවාරණය', 'ජනාඩ්හිපාට්හිවාරණය', 'ජානාඩ්හිපාට්හිවාරණය',
        'ජණද්හිපාට්හිවාරණය',  'ජාණද්හිපාට්හිවාරණය',  'ජනද්හිපාට්හිවාරණය',  'ජානද්හිපාට්හිවාරණය',
        'ජණාද්හිපාට්හිවාරණය', 'ජාණාද්හිපාට්හිවාරණය', 'ජනාද්හිපාට්හිවාරණය', 'ජානාද්හිපාට්හිවාරණය',

		*/