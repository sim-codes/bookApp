import { strFromU8, unzipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDictionary } from '../dictionary';
import { lookupTermsFor } from '../lookupTerms';
import type { Shard } from '../types';

const loadShardFromDisk = async (key: string): Promise<Shard> => {
    const zip = readFileSync(join(__dirname, '..', '..', '..', 'assets', 'dictionary', `${key}.zip`));
    return JSON.parse(strFromU8(unzipSync(new Uint8Array(zip))['shard.json']));
};

describe('lookupTermsFor', () => {
    it('strips punctuation, curly quotes and possessives', () => {
        expect(lookupTermsFor('  “Elephant’s,”  ')).toEqual(['elephant']);
    });

    it('tries a short phrase before its first word', () => {
        expect(lookupTermsFor('Ice cream')).toEqual(['ice_cream', 'ice']);
    });

    it('falls back to the first word of a long selection', () => {
        expect(lookupTermsFor('the quick brown fox jumped')).toEqual(['the']);
    });

    it('returns nothing for a selection without letters', () => {
        expect(lookupTermsFor(' — … ')).toEqual([]);
    });
});

describe('dictionary.lookup', () => {
    const dictionary = createDictionary(loadShardFromDisk);

    it('defines a common word', async () => {
        const result = await dictionary.lookup('bank');
        expect(result.words[0].word).toBe('bank');
        expect(result.words[0].entries.map(entry => entry.partOfSpeech)).toEqual(['noun', 'verb']);
        expect(result.words[0].entries[0].senses[0].definition).toMatch(/sloping land/);
    });

    it.each([
        ['went', 'go'],
        ['geese', 'goose'],
        ['stopped', 'stop'],
        ['happier', 'happy'],
        ['churches', 'church'],
    ])('finds the base form of %s', async (inflected, base) => {
        const result = await dictionary.lookup(inflected);
        expect(result.words.map(word => word.word)).toContain(base);
    });

    it('defines a rare word from its letter file', async () => {
        const result = await dictionary.lookup('Zymurgy.');
        expect(result.query).toBe('zymurgy');
        expect(result.words[0].entries[0].senses[0].definition).toMatch(/ferment/);
    });

    it('defines a phrase', async () => {
        const result = await dictionary.lookup('ice cream');
        expect(result.words[0].word).toBe('ice cream');
    });

    it('reports words it does not know', async () => {
        const result = await dictionary.lookup('Hermione');
        expect(result).toEqual({ query: 'hermione', words: [] });
    });
});
