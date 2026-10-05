# singlish-search
This module allows to find all Sinhala words matching a given singlish word. 
This is useful when searching Sinhala content using English letters. For example if a user wants to search for 'නිර්වාන' in Sinhala he may type 'nirvana' in Singlish. This module allows to find all possible Sinhala words that match the given Singlish query such as නිර්වාණ

This tool removes the guesswork needed when figuring out the correct spelling of Sinhala words and allows searching content even when the correct spelling was not used in the content being searched.

## Usage
`getPossibleMatches('singlish-query', { maxMatches = 300 })`

e.g. `getPossibleMatches('nirvana')` will find the possible matches, most likely first (නිර්වන, නිර්වාන, නිර්වාණ, ...)

Matches are ranked with a Sinhala letter trigram model (`singlish-model.js`) built from the tipitaka.lk, arutha.lk and file-server-v2 texts, and at most `maxMatches` are returned. So shortcut spellings (e.g. `i` for ී, `e` for ේ) and long words can be used without the number of matches exploding.

## Development
- `npm run corpus` - extract word lists from the sibling projects' databases into `data/` and build the gold (singlish, sinhala) pairs
- `npm run build-model` - rebuild `singlish-model.js` from `data/` (`--holdout` leaves out the gold words)
- `npm run eval` - compare recall and number of matches with previous versions

# Roman convert
This allows to convert Sinhala text to the equivalent Roman transliteration and vice versa

## Usage
`sinhalaToRomanConvert('බුද්ධ ජයන්ති ත්‍රිපිටකය')` should give the output `buddha jayanti tripiṭakaya`

`romanToSinhalaConvert('buddha jayanti tripiṭakaya')` should give the output `බුද්ධ ජයන්ති ත්‍රිපිටකය`