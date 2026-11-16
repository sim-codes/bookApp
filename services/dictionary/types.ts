export type PosCode = 'n' | 'v' | 'a' | 'r';

export type RawSense = [definition: string, example?: string, synonyms?: string[]];

export type RawEntry = [pos: PosCode, senses: RawSense[]];

export interface Shard {
    words: Record<string, string>;
    exceptions?: Record<PosCode, Record<string, string[]>>;
}

export interface DictionarySense {
    definition: string;
    example?: string;
    synonyms: string[];
}

export interface DictionaryEntry {
    partOfSpeech: string;
    senses: DictionarySense[];
}

export interface DictionaryWord {
    word: string;
    entries: DictionaryEntry[];
}

export interface LookupResult {
    query: string;
    words: DictionaryWord[];
}

export type ShardLoader = (key: string) => Promise<Shard>;
