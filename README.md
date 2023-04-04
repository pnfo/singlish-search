# singlish-search
This module allows to find all Sinhala words matching a given singlish word. 
This is useful when searching Sinhala content using English letters. For example if a user wants to search for 'නිර්වාන' in Sinhala he may type 'nirvana' in Singlish. This module allows to find all possible Sinhala words that match the given Singlish query such as නිර්වාණ

This tool removes the guesswork needed when figuring out the correct spelling of Sinhala words and allows searching content even when the correct spelling was not used in the content being searched.

## Usage
`getPossibleMatches('singlish-query')`

e.g. `getPossibleMatches('nirvana')` will search find all possible matches

# Roman convert
This allows to convert Sinhala text to the equivalent Roman transliteration and vice versa

## Usage
`sinhalaToRomanConvert('බුද්ධ ජයන්ති ත්‍රිපිටකය')` should give the output `buddha jayanti tripiṭakaya`

`romanToSinhalaConvert('buddha jayanti tripiṭakaya')` should give the output `බුද්ධ ජයන්ති ත්‍රිපිටකය`