import { getPossibleMatches, isSinglishQuery } from './singlish.js'

describe('Singlish Query', () => {
    test('nirvana is a singlish query', () => {
      expect(isSinglishQuery('nirvana')).toBe(true);
      expect(isSinglishQuery('නිර්වාන')).toBe(false);
      expect(isSinglishQuery('නිර්වානnir')).toBe(true);
    });
})

describe('get matches', () => {
    const expectedMatches = [
        'ණිර්වණ',   'නිර්වණ',   'ණිර්වාණ',
        'නිර්වාණ',  'ණිර්වන',   'නිර්වන',
        'ණිර්වාන',  'නිර්වාන',  'ණිර්වණා',
        'නිර්වණා',  'ණිර්වාණා', 'නිර්වාණා',
        'ණිර්වනා',  'නිර්වනා',  'ණිර්වානා',
        'නිර්වානා'].sort() // sort in case out of order
    const matches = getPossibleMatches('nirvana')
    test('nirvana', () => {
        expect(matches).toEqual(expect.arrayContaining(expectedMatches));
    });
    test('ranked', () => {
        expect(matches.slice(0, 3)).toContain('නිර්වාණ')
    })
    test('expected', () => {
        expect(matches.includes('නිර්වාන') && matches.includes('නිර්වාණ')).toBe(true)
    })
})

describe('length check', () => {
    const test1 = 'ආනන්ද මෛත්‍රී හිමියන් ගේ ගන්දබ්බ්'
    test('1', () => {
        expect(getPossibleMatches(test1)).toEqual([test1])
    })
    const test2 = 'ආනන්ද මෛත්‍රී hiමි'
    test('2', () => {
        expect(getPossibleMatches(test2)[0]).toEqual('ආනන්ද මෛත්‍රී හිමි')
    })
})

describe('explosion check', () => {
    const matches = getPossibleMatches('janadhipathi')
    test('expected', () => {
        expect(matches.includes('ජනාධිපති')).toBe(true)
    })
    test('length', () => {
        expect(matches.length < 500)
    })
    const matches2 = getPossibleMatches('janadhipathivaranaya') //this still has more than 4000 results 
    test('expected', () => {
        expect(matches2.includes('ජනාධිපතිවරණය')).toBe(true)
    })
})

describe('rakar check', () => {
    const matches = getPossibleMatches('shasthraya')
    test('expected', () => {
        expect(matches.includes('ශාස්ත්‍රය')).toBe(true)
    })
})

describe('yansa check', () => {
    const matches = getPossibleMatches('sankhyava')
    const expectedMatches = [
        'සඞ්ඛ්යව',    'සාඞ්ඛ්යව',   'සංඛ්යව',    'සාංඛ්යව',   'සණ්ඛ්යව',
        'සාණ්ඛ්යව',   'සන්ඛ්යව',    'සාන්ඛ්යව',   'සඞ්ඛ්යාව',   'සාඞ්ඛ්යාව',
        'සංඛ්යාව',   'සාංඛ්යාව',  'සණ්ඛ්යාව',   'සාණ්ඛ්යාව',  'සන්ඛ්යාව',
        'සාන්ඛ්යාව',  'සඞ්ඛ්යවා',   'සාඞ්ඛ්යවා',  'සංඛ්යවා',   'සාංඛ්යවා',
        'සණ්ඛ්යවා',   'සාණ්ඛ්යවා',  'සන්ඛ්යවා',   'සාන්ඛ්යවා',  'සඞ්ඛ්යාවා',
        'සාඞ්ඛ්යාවා', 'සංඛ්යාවා',  'සාංඛ්යාවා', 'සණ්ඛ්යාවා',  'සාණ්ඛ්යාවා',
        'සන්ඛ්යාවා',  'සාන්ඛ්යාවා', 'සඞ්ඛ්‍යව',    'සාඞ්ඛ්‍යව',   'සංඛ්‍යව',
        'සාංඛ්‍යව',   'සණ්ඛ්‍යව',    'සාණ්ඛ්‍යව',   'සන්ඛ්‍යව',    'සාන්ඛ්‍යව',
        'සඞ්ඛ්‍යාව',   'සාඞ්ඛ්‍යාව',  'සංඛ්‍යාව',   'සාංඛ්‍යාව',  'සණ්ඛ්‍යාව',
        'සාණ්ඛ්‍යාව',  'සන්ඛ්‍යාව',   'සාන්ඛ්‍යාව',  'සඞ්ඛ්‍යවා',   'සාඞ්ඛ්‍යවා',
        'සංඛ්‍යවා',   'සාංඛ්‍යවා',  'සණ්ඛ්‍යවා',   'සාණ්ඛ්‍යවා',  'සන්ඛ්‍යවා',
        'සාන්ඛ්‍යවා',  'සඞ්ඛ්‍යාවා',  'සාඞ්ඛ්‍යාවා', 'සංඛ්‍යාවා',  'සාංඛ්‍යාවා',
        'සණ්ඛ්‍යාවා',  'සාණ්ඛ්‍යාවා', 'සන්ඛ්‍යාවා',  'සාන්ඛ්‍යාවා'
    ].sort()
    test('sankhyava', () => {
        expect(matches).toEqual(expect.arrayContaining(expectedMatches));
    });
    test('expected', () => {
        expect(matches.includes('සංඛ්‍යාව')).toBe(true)
    })
})

describe('recall check', () => {
    const cases = {
        dharmaya: 'ධර්මය', kotaheena: 'කොටහේන', yamakhata: 'යමක්හට', davashi: 'දවස්හි',
        siddhaartha: 'සිද්ධාර්ථ', prathipaththi: 'ප්‍රතිපත්ති', bhikkhu: 'භික්ඛු',
    }
    for (const [singlish, sinhala] of Object.entries(cases)) {
        test(singlish, () => {
            expect(getPossibleMatches(singlish)).toContain(sinhala)
        })
    }
})

describe('filter check', () => {
    test('aspirate split', () => {
        expect(getPossibleMatches('dharmaya').filter(m => m.includes('ද්හ') || m.includes('ඩ්හ'))).toEqual([])
    })
    test('hal followed by independent vowel', () => {
        expect(getPossibleMatches('kotahena').filter(m => /්[ඔඑ]/.test(m))).toEqual([])
    })
    test('long list does not exceed call stack', () => {
        expect(() => getPossibleMatches('aknknamaknknadukan')).not.toThrow()
    })
})

describe('ranking check', () => {
    test('most likely first', () => {
        expect(getPossibleMatches('janadhipathivaranaya')[0]).toEqual('ජනාධිපතිවරණය')
        expect(getPossibleMatches('samanthabhadra')[0]).toEqual('සමන්තභද්‍ර')
        expect(getPossibleMatches('gedara')[0]).toEqual('ගෙදර')
    })
    test('max matches', () => {
        expect(getPossibleMatches('janadhipathivaranaya').length).toEqual(300)
        expect(getPossibleMatches('janadhipathivaranaya', { maxMatches: 10 }).length).toEqual(10)
    })
    test('shortcut spellings', () => {
        expect(getPossibleMatches('vahanse', { maxMatches: 10 })).toContain('වහන්සේ')
        expect(getPossibleMatches('bhikkhu', { maxMatches: 10 })).toContain('භික්ඛූ')
    })
})
