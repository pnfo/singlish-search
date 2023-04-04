import { romanToSinhalaConvert, sinhalaToRomanConvert, genTestPattern } from './roman_convert.js'

describe('Roman convert', () => {
    test('double convert should be equal to the original', () => {
        const testPattern = genTestPattern()
        expect(romanToSinhalaConvert(sinhalaToRomanConvert(testPattern))).toEqual(testPattern);
    });
})