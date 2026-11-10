// Native modules replaced with in-memory versions so services can be tested without a device.

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
    const store = new Map<string, string>();
    return {
        getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
        setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
        deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
    };
});

jest.mock('expo-crypto', () => ({
    randomUUID: () => require('crypto').randomUUID(),
}));

jest.mock('expo-file-system/legacy', () => ({
    documentDirectory: 'file:///docs/',
    cacheDirectory: 'file:///cache/',
    EncodingType: { Base64: 'base64' },
    FileSystemUploadType: { BINARY_CONTENT: 0 },
    getInfoAsync: jest.fn(async () => ({ exists: true })),
    makeDirectoryAsync: jest.fn(),
    copyAsync: jest.fn(),
    deleteAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    uploadAsync: jest.fn(async () => ({ status: 200 })),
    downloadAsync: jest.fn(async (_url: string, uri: string) => ({ status: 200, uri })),
}));
