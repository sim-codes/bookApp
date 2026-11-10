import { randomUUID } from 'expo-crypto';

/** Creates the id for a new book or reading session; the same UUID is used on the server. */
export function newId(): string {
    return randomUUID();
}
