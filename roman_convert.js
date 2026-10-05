
/**
 * Created by Janaka on 2017-01-15.
 * Modified to new JS standards on 2023-03-08
 */
// sinhala unicode, roman
const ro_specials = [
    /* VOWELS */
    ['ඓ', 'ai'], // sinhala only begin - only kai and ai occurs in reality
    ['ඖ', 'au'], // ambiguous conversions e.g. k+au = ka+u = kau, a+u = au but only kau and au occurs in reality
    ['ඍ', 'ṛ'],
    ['ඎ', 'ṝ'],
    //['ඏ', 'ḷ'], // removed because conflicting with ළ් and very rare
    ['ඐ', 'ḹ'], // sinhala only end
        
    ['අ', 'a'],
    ['ආ', 'ā'],
    ['ඇ', 'æ'], ['ඇ', 'Æ', 1],
    ['ඈ', 'ǣ'],
    ['ඉ', 'i'],
    ['ඊ', 'ī'],
    ['උ', 'u'],
    ['ඌ', 'ū'],
    ['එ', 'e'],
    ['ඒ', 'ē'],
    ['ඔ', 'o'],
    ['ඕ', 'ō'],

    /* SPECIALS */
    ['ඞ්', 'ṅ'], // not used in combi
    ['ං', 'ṃ'], ['ං', 'ṁ', 1], // IAST, use both
    ['ඃ', 'ḥ'], ['ඃ', 'Ḥ', 1] // sinhala only
];

// iast, and iso 15919 for the sinhala only letters (prenasals use a breve e.g. n̆d)
// one-way (roman -> sinhala only) mappings accept older spellings, \uF826 (private use) marks the prenasals in some old texts
const ro_consonants = [
    ['ඛ', 'kh'],
    ['ඨ', 'ṭh'],
    ['ඝ', 'gh'],
    ['ඡ', 'ch'],
    ['ඣ', 'jh'],
    ['ඦ', 'n̆j'], // non pali
    ['ඪ', 'ḍh'],
    ['ඬ', 'n̆ḍ'], ['ඬ', '\uF826dh', 1], // non pali
    ['ථ', 'th'],
    ['ධ', 'dh'],
    ['ඵ', 'ph'],    
    ['භ', 'bh'],    
    ['ඹ', 'm̆b'], // non pali
    ['ඳ', 'n̆d'], ['ඳ', 'ṉd', 1], ['ඳ', '\uF826d', 1], // non pali
    ['ඟ', 'n̆g'], ['ඟ', 'ṉg', 1], ['ඟ', '\uF826g', 1], // non pali
    ['ඥ', 'jñ'], // non pali
    
    ['ක', 'k'],
    ['ග', 'g'],    
    ['ච', 'c'],    
    ['ජ', 'j'],    
    ['ඤ', 'ñ'],        
    ['ට', 'ṭ'],    
    ['ඩ', 'ḍ'],    
    ['ණ', 'ṇ'],    
    ['ත', 't'],    
    ['ද', 'd'],
    ['න', 'n'],
    ['ප', 'p'],
    ['බ', 'b'],
    ['ම', 'm'],
    ['ය', 'y'],
    ['ර', 'r'],
    ['ල', 'l'],
    ['ව', 'v'],
    ['ශ', 'ś'],
    ['ෂ', 'ṣ'], ['ෂ', 'Ṣ', 1], ['ෂ', 'ş', 1],
    ['ස', 's'],
    ['හ', 'h'],
    ['ළ', 'ḷ'],
    ['ෆ', 'f']  
];

// sinh before, sinh after, roman after
const ro_combinations = [
    ['', '', '්'], //ක්
    ['', 'a', ''], //ක
    ['', 'ā', 'ා'], //කා
    ['', 'æ', 'ැ'], // non pali
    ['', 'ǣ', 'ෑ'], // non pali
    ['', 'i', 'ි'],
    ['', 'ī', 'ී'],
    ['', 'u', 'ු'],
    ['', 'ū', 'ූ'],
    ['', 'e', 'ෙ'],
    ['', 'ē', 'ේ'], // non pali
    ['', 'ai', 'ෛ'], // non pali
    ['', 'o', 'ො'],
    ['', 'ō', 'ෝ'], // non pali
    
    ['', 'ṛ', 'ෘ'],  // sinhala only begin
    ['', 'ṝ', 'ෲ'],
    ['', 'au', 'ෞ'],
    //['', 'ḷ', 'ෟ'], // conflicting with ළ් - might cause bugs - removed bcs very rare
    ['', 'ḹ', 'ෳ'] // sinhala only end
];


const ro_conso_combi = createConsoCombi(ro_combinations, ro_consonants);
// longest first, so that e.g. kha is replaced before ka - sorted once for each direction (0 sinhala->roman, 1 roman->sinhala)
const sortedMappings = [0, 1].map(dir => [ro_conso_combi, ro_specials].map(list => list
    .filter(m => m.length < 3 || m[2] == dir) // one-way mappings
    .sort((a, b) => b[dir].length - a[dir].length)))

export function romanToSinhalaConvert(text) {
    text = genericConvert(text.normalize('NFC'), 1); // combining diacritics (e.g. from pdfs) to single letters
    // add zwj for yansa and rakaransa
    text = replaceRe(text, '්ර','්‍ර'); // rakar
    return replaceRe(text, '්ය','්‍ය'); // yansa
}

export function sinhalaToRomanConvert(text) {
    // remove zwj since it does not occur in roman
    text = replaceRe(text, '\u200D', '');
    return genericConvert(text, 0);
}



function replaceRe(text, f, r) {
    const re = new RegExp(f, "gi");
    return text.replace(re, r);
}

function genericConvert(text, dir) {
    sortedMappings[dir].forEach(list => list.forEach(m => {
        text = replaceRe(text, m[dir], m[+!dir]);
    }));
    return text
}

// create permutations
function createConsoCombi(combinations, consonants) {
    const conso_combi = [];
    combinations.forEach(combi => {
        consonants.forEach(conso => {
            var cc = [conso[0] + combi[2], combi[0] + conso[1] + combi[1]];
            if (conso.length > 2) { // add one-way direction if any
                cc.push(conso[2]);
            }
            conso_combi.push(cc);
        });
    });
    return conso_combi;
}

export function genTestPattern() {
    let testSinh = '';
    ro_conso_combi.forEach(cc => {
        if (cc.length < 3 || cc[2] == 0) {
            testSinh += cc[0] + ' ';
        }
    });

    ro_specials.forEach(v => {
        if (v.length < 3 || v[2] == 0) {
            testSinh += v[0] + ' ';
        }
    });
    return testSinh;
}
//module.exports = {romanToSinhalaConvert, sinhalaToRomanConvert, genTestPattern}