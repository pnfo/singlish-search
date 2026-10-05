import { romanToSinhalaConvert, sinhalaToRomanConvert, genTestPattern } from './roman_convert.js'

describe('Roman convert', () => {
    test('double convert should be equal to the original', () => {
        const testPattern = genTestPattern()
        expect(romanToSinhalaConvert(sinhalaToRomanConvert(testPattern))).toEqual(testPattern);
    });
})

describe('convert', () => {
    test('readme example', () => {
        expect(sinhalaToRomanConvert('බුද්ධ ජයන්ති ත්‍රිපිටකය')).toEqual('buddha jayanti tripiṭakaya')
        expect(romanToSinhalaConvert('buddha jayanti tripiṭakaya')).toEqual('බුද්ධ ජයන්ති ත්‍රිපිටකය')
    })
    test('combining diacritics', () => {
        expect(romanToSinhalaConvert('tipiṭaka'.normalize('NFD'))).toEqual('තිපිටක')
    })
    test('old prenasal mark', () => {
        expect(romanToSinhalaConvert('\uF826da \uF826ga ṉda ṉga')).toEqual('ඳ ඟ ඳ ඟ')
    })
    test('sinhala only letters (iso 15919)', () => {
        expect(sinhalaToRomanConvert('ඬ ඹ ඦ ඳ ඟ ඥ ෂ ඇ ඈ ඒ ඕ ෆ')).toEqual('n̆ḍa m̆ba n̆ja n̆da n̆ga jña ṣa æ ǣ ē ō fa')
    })
    test('ş accepted for ෂ', () => {
        expect(romanToSinhalaConvert('kṛşi')).toEqual('කෘෂි')
    })
})

describe('Pali round trip', () => {
    const words = ['දණ්ඩ', 'පණ්ඩිත', 'අම්බර', 'සම්බුද්ධ', 'භුඤ්ජති', 'අග්නි', 'ප්‍රඥා', 'කණ්ඩය', 'සඳ', 'අඹ', 'ගඟ']
    for (const word of words) {
        test(word, () => {
            expect(romanToSinhalaConvert(sinhalaToRomanConvert(word))).toEqual(word)
        })
    }
})
