const MAX_PHRASE_WORDS = 4;

export function lookupTermsFor(selection: string): string[] {
    const words = selection
        .toLowerCase()
        .replace(/[‘’ʼ]/g, "'")
        .replace(/[‐-―]/g, '-')
        .split(/\s+/)
        .map(word => word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').replace(/'s$/, ''))
        .filter(Boolean);

    if (words.length === 0) return [];
    if (words.length === 1 || words.length > MAX_PHRASE_WORDS) return [words[0]];
    return [words.join('_'), words[0]];
}
