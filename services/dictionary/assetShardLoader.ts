import { base64ToBytes } from '@/utils/base64';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { strFromU8, unzipSync } from 'fflate';
import { SHARD_ASSETS } from './shardAssets';
import type { Shard, ShardLoader } from './types';

export const loadShardFromAssets: ShardLoader = async key => {
    const asset = await Asset.fromModule(SHARD_ASSETS[key]).downloadAsync();
    if (!asset.localUri) throw new Error(`Dictionary file ${key} is unavailable`);
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, { encoding: FileSystem.EncodingType.Base64 });
    const files = unzipSync(base64ToBytes(base64));
    return JSON.parse(strFromU8(files['shard.json'])) as Shard;
};
