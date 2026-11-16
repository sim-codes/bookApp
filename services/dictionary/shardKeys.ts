export const COMMON_SHARD = 'common';
export const OTHER_SHARD = 'other';
export const LETTER_SHARDS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function shardKeyFor(lemma: string): string {
    const first = lemma.charAt(0);
    return first >= 'a' && first <= 'z' ? first : OTHER_SHARD;
}
