import type { PosCode, Shard } from './types';

const SUFFIX_RULES: Record<PosCode, [suffix: string, replacement: string][]> = {
    n: [['s', ''], ['ses', 's'], ['xes', 'x'], ['zes', 'z'], ['ches', 'ch'], ['shes', 'sh'], ['men', 'man'], ['ies', 'y']],
    v: [['s', ''], ['ies', 'y'], ['es', 'e'], ['es', ''], ['ed', 'e'], ['ed', ''], ['ing', 'e'], ['ing', '']],
    a: [['er', ''], ['est', ''], ['er', 'e'], ['est', 'e']],
    r: [],
};

const DOUBLED_CONSONANT = /([b-df-hj-np-tv-z])\1$/;

export function baseFormsFor(word: string, exceptions: Shard['exceptions']): string[] {
    const forms = new Set<string>([word]);

    for (const pos of Object.keys(SUFFIX_RULES) as PosCode[]) {
        for (const base of exceptions?.[pos]?.[word] ?? []) forms.add(base);
    }

    for (const rules of Object.values(SUFFIX_RULES)) {
        for (const [suffix, replacement] of rules) {
            if (word.length <= suffix.length + 1 || !word.endsWith(suffix)) continue;
            const stem = word.slice(0, -suffix.length);
            forms.add(stem + replacement);
            if (!replacement && DOUBLED_CONSONANT.test(stem)) forms.add(stem.slice(0, -1));
        }
    }

    return [...forms];
}
