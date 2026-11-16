import { baseFormsFor } from './baseForms';
import { lookupTermsFor } from './lookupTerms';
import { COMMON_SHARD, shardKeyFor } from './shardKeys';
import type { DictionaryWord, LookupResult, PosCode, RawEntry, Shard, ShardLoader } from './types';

const MAX_WORDS = 2;

const PART_OF_SPEECH: Record<PosCode, string> = {
    n: 'noun',
    v: 'verb',
    a: 'adjective',
    r: 'adverb',
};

function toWord(lemma: string, raw: string): DictionaryWord {
    const entries = (JSON.parse(raw) as RawEntry[]).map(([pos, senses]) => ({
        partOfSpeech: PART_OF_SPEECH[pos],
        senses: senses.map(([definition, example, synonyms]) => ({
            definition,
            example: example || undefined,
            synonyms: synonyms ?? [],
        })),
    }));
    return { word: lemma.replace(/_/g, ' '), entries };
}

export function createDictionary(loadShard: ShardLoader) {
    const shards = new Map<string, Promise<Shard>>();

    const shard = (key: string): Promise<Shard> => {
        let pending = shards.get(key);
        if (!pending) {
            pending = loadShard(key);
            pending.catch(() => shards.delete(key));
            shards.set(key, pending);
        }
        return pending;
    };

    const find = async (lemma: string, common: Shard): Promise<string | undefined> =>
        common.words[lemma] ?? (await shard(shardKeyFor(lemma))).words[lemma];

    const lookup = async (selection: string): Promise<LookupResult> => {
        const terms = lookupTermsFor(selection);
        const query = (terms[0] ?? selection.trim()).replace(/_/g, ' ');
        if (terms.length === 0) return { query, words: [] };

        const common = await shard(COMMON_SHARD);
        for (const term of terms) {
            const words: DictionaryWord[] = [];
            for (const form of baseFormsFor(term, common.exceptions)) {
                const raw = await find(form, common);
                if (raw) words.push(toWord(form, raw));
                if (words.length === MAX_WORDS) break;
            }
            if (words.length) return { query: term.replace(/_/g, ' '), words };
        }
        return { query, words: [] };
    };

    return { lookup, preload: () => shard(COMMON_SHARD).then(() => undefined) };
}
