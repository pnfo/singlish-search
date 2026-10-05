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
        expect(romanToSinhalaConvert('\uF826da \uF826ga')).toEqual('ඳ ඟ')
    })
})
