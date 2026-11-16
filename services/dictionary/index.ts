import { loadShardFromAssets } from './assetShardLoader';
import { createDictionary } from './dictionary';

export const dictionary = createDictionary(loadShardFromAssets);

export { createDictionary } from './dictionary';
export type { DictionaryEntry, DictionarySense, DictionaryWord, LookupResult } from './types';
