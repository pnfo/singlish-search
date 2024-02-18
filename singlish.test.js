import { getPossibleMatches, isSinglishQuery } from './singlish.js'

describe('Singlish Query', () => {
    test('nirvana is a singlish query', () => {
      expect(isSinglishQuery('nirvana')).toBe(true);
      expect(isSinglishQuery('නිර්වාන')).toBe(false);
      expect(isSinglishQuery('නිර්වානnir')).toBe(true);
    });
})

describe('get matches', () => {
    const nirvanaMatches = [
        'ඤිර්වඤ',   'ණිර්වඤ',   'නිර්වඤ',   'ඤීර්වඤ',   'ණීර්වඤ',
        'නීර්වඤ',   'ඤිර්වාඤ',  'ණිර්වාඤ',  'නිර්වාඤ',  'ඤීර්වාඤ',
        'ණීර්වාඤ',  'නීර්වාඤ',  'ඤිර්වණ',   'ණිර්වණ',   'නිර්වණ',
        'ඤීර්වණ',   'ණීර්වණ',   'නීර්වණ',   'ඤිර්වාණ',  'ණිර්වාණ',
        'නිර්වාණ',  'ඤීර්වාණ',  'ණීර්වාණ',  'නීර්වාණ',  'ඤිර්වන',
        'ණිර්වන',   'නිර්වන',   'ඤීර්වන',   'ණීර්වන',   'නීර්වන',
        'ඤිර්වාන',  'ණිර්වාන',  'නිර්වාන',  'ඤීර්වාන',  'ණීර්වාන',
        'නීර්වාන',  'ඤිර්වඤා',  'ණිර්වඤා',  'නිර්වඤා',  'ඤීර්වඤා',
        'ණීර්වඤා',  'නීර්වඤා',  'ඤිර්වාඤා', 'ණිර්වාඤා', 'නිර්වාඤා',
        'ඤීර්වාඤා', 'ණීර්වාඤා', 'නීර්වාඤා', 'ඤිර්වණා',  'ණිර්වණා',
        'නිර්වණා',  'ඤීර්වණා',  'ණීර්වණා',  'නීර්වණා',  'ඤිර්වාණා',
        'ණිර්වාණා', 'නිර්වාණා', 'ඤීර්වාණා', 'ණීර්වාණා', 'නීර්වාණා',
        'ඤිර්වනා',  'ණිර්වනා',  'නිර්වනා',  'ඤීර්වනා',  'ණීර්වනා',
        'නීර්වනා',  'ඤිර්වානා', 'ණිර්වානා', 'නිර්වානා', 'ඤීර්වානා',
        'ණීර්වානා', 'නීර්වානා'].sort() // sort in case out of order
    test('nirvana', () => {
        expect(getPossibleMatches('nirvana').sort()).toEqual(nirvanaMatches);
    });
})

describe('length check', () => {
    const test1 = 'ආනන්ද මෛත්‍රී හිමියන් ගේ ගන්දබ්බ්'
    test('1', () => {
        expect(getPossibleMatches(test1)).toEqual([test1])
    })
    const test2 = 'ආනන්ද මෛත්‍රී hiමි'
    test('2', () => {
        expect(getPossibleMatches(test2)).toEqual(['ආනන්ද මෛත්‍රී හිමි', 'ආනන්ද මෛත්‍රී හීමි'])
    })
})