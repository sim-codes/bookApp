import { gunzipSync, strFromU8, strToU8, zipSync } from 'fflate';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { COMMON_SHARD, LETTER_SHARDS, OTHER_SHARD, shardKeyFor } from '../services/dictionary/shardKeys';
import type { PosCode, RawEntry, RawSense, Shard } from '../services/dictionary/types';

const SOURCE_URL = 'https://wordnetcode.princeton.edu/wn3.1.dict.tar.gz';
const CACHE_PATH = join(tmpdir(), 'wn3.1.dict.tar.gz');
const OUT_DIR = join(__dirname, '..', 'assets', 'dictionary');

const MAX_SENSES_PER_POS = 4;
const MAX_SYNONYMS = 4;
const POS_FILES: { file: string; code: PosCode }[] = [
    { file: 'noun', code: 'n' },
    { file: 'verb', code: 'v' },
    { file: 'adj', code: 'a' },
    { file: 'adv', code: 'r' },
];

interface Synset {
    words: string[];
    definition: string;
    example?: string;
}

async function loadTarball(): Promise<Uint8Array> {
    if (!existsSync(CACHE_PATH)) {
        console.log(`Downloading ${SOURCE_URL}`);
        const response = await fetch(SOURCE_URL);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        writeFileSync(CACHE_PATH, Buffer.from(await response.arrayBuffer()));
    }
    return gunzipSync(new Uint8Array(readFileSync(CACHE_PATH)));
}

function untar(tar: Uint8Array): Map<string, string> {
    const files = new Map<string, string>();
    let offset = 0;
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512);
        const name = strFromU8(header.subarray(0, 100)).replace(/\0.*$/s, '');
        if (!name) break;
        const size = parseInt(strFromU8(header.subarray(124, 136)).replace(/\0.*$/s, '').trim() || '0', 8);
        const type = String.fromCharCode(header[156]);
        const body = tar.subarray(offset + 512, offset + 512 + size);
        if (type === '0' || type === '\0') files.set(name.replace(/^.*\//, ''), strFromU8(body));
        offset += 512 + Math.ceil(size / 512) * 512;
    }
    return files;
}

function parseGloss(gloss: string): { definition: string; example?: string } {
    const quoted = gloss.match(/"([^"]+)"/);
    const definition = gloss.split(/;\s*"/)[0].replace(/"[^"]*"/g, '').replace(/[;\s]+$/, '').trim();
    return { definition, example: quoted?.[1].trim() };
}

function parseData(text: string): Map<string, Synset> {
    const synsets = new Map<string, Synset>();
    for (const line of text.split('\n')) {
        if (!line || line.startsWith(' ')) continue;
        const [fields, gloss = ''] = line.split(' | ');
        const parts = fields.split(' ');
        const wordCount = parseInt(parts[3], 16);
        const words: string[] = [];
        for (let i = 0; i < wordCount; i++) {
            words.push(parts[4 + i * 2].replace(/\(.*\)$/, '').toLowerCase());
        }
        synsets.set(parts[0], { words, ...parseGloss(gloss) });
    }
    return synsets;
}

function parseExceptions(text: string): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    for (const line of text.split('\n')) {
        const [inflected, ...bases] = line.trim().split(' ');
        if (inflected && bases.length) map[inflected] = bases;
    }
    return map;
}

async function main() {
    const files = untar(await loadTarball());
    const entries = new Map<string, { entry: RawEntry; tagCount: number }[]>();

    for (const { file, code } of POS_FILES) {
        const synsets = parseData(files.get(`data.${file}`)!);
        for (const line of files.get(`index.${file}`)!.split('\n')) {
            if (!line || line.startsWith(' ')) continue;
            const parts = line.trim().split(' ');
            const lemma = parts[0];
            const pointerCount = parseInt(parts[3], 10);
            const tagSenseCount = parseInt(parts[5 + pointerCount], 10);
            const offsets = parts.slice(6 + pointerCount);

            const senses: RawSense[] = offsets.slice(0, MAX_SENSES_PER_POS).map(offset => {
                const synset = synsets.get(offset)!;
                const synonyms = synset.words
                    .filter(word => word !== lemma)
                    .slice(0, MAX_SYNONYMS)
                    .map(word => word.replace(/_/g, ' '));
                const sense: RawSense = [synset.definition];
                if (synset.example || synonyms.length) sense.push(synset.example ?? '');
                if (synonyms.length) sense.push(synonyms);
                return sense;
            });

            const list = entries.get(lemma) ?? [];
            list.push({ entry: [code, senses], tagCount: tagSenseCount });
            entries.set(lemma, list);
        }
    }

    const shards = new Map<string, Shard>();
    for (const key of [COMMON_SHARD, ...LETTER_SHARDS, OTHER_SHARD]) shards.set(key, { words: {} });

    shards.get(COMMON_SHARD)!.exceptions = Object.fromEntries(
        POS_FILES.map(({ file, code }) => [code, parseExceptions(files.get(`${file}.exc`)!)]),
    ) as Shard['exceptions'];

    for (const [lemma, list] of entries) {
        list.sort((a, b) => b.tagCount - a.tagCount);
        const isCommon = list.some(item => item.tagCount > 0);
        const key = isCommon ? COMMON_SHARD : shardKeyFor(lemma);
        shards.get(key)!.words[lemma] = JSON.stringify(list.map(item => item.entry));
    }

    mkdirSync(OUT_DIR, { recursive: true });
    let total = 0;
    for (const [key, shard] of shards) {
        const zipped = zipSync({ 'shard.json': strToU8(JSON.stringify(shard)) }, { level: 9 });
        writeFileSync(join(OUT_DIR, `${key}.zip`), zipped);
        total += zipped.length;
        console.log(`${key}: ${Object.keys(shard.words).length} words, ${(zipped.length / 1024).toFixed(0)} KB`);
    }
    console.log(`Total: ${entries.size} words, ${(total / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
