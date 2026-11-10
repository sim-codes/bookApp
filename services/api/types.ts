import { ReadingStatus } from '@/types';

// Response and request shapes of the Spinematch API. Dates are ISO 8601 strings.

export interface ApiUser {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
}

export interface AuthTokens {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    user: ApiUser;
}

export interface CursorPage<T> {
    items: T[];
    nextCursor: string | null;
}

export interface ApiBook {
    id: string;
    ownerId: string;
    ownerDisplayName: string;
    title: string;
    author: string;
    genre: string | null;
    fileName: string | null;
    isPublic: boolean;
    isShareable: boolean;
    hasFile: boolean;
    coverUrl: string | null;
    likeCount: number;
    likedByMe: boolean;
    inMyLibrary: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBookRequest {
    id: string;
    title: string;
    author: string;
    genre?: string;
    fileName?: string;
    isPublic: boolean;
    isShareable: boolean;
}

export interface UpdateBookRequest {
    title?: string;
    author?: string;
    genre?: string;
    isPublic?: boolean;
    isShareable?: boolean;
}

export interface UploadUrls {
    fileUploadUrl: string | null;
    coverUploadUrl: string | null;
    expiresAt: string;
}

export interface DownloadUrl {
    url: string;
    expiresAt: string;
}

export interface ApiReadingState {
    bookId: string;
    status: ReadingStatus;
    currentPage: number;
    totalPages: number | null;
    epubLocator: string | null;
    updatedAt: string;
    serverUpdatedAt: string;
}

export interface ReadingStateRequest {
    status: ReadingStatus;
    currentPage: number;
    totalPages?: number;
    epubLocator?: string;
    updatedAt: string;
}

export interface ReadingStateChanges {
    items: ApiReadingState[];
    cursor: string | null;
    hasMore: boolean;
}

export interface ReadingSessionUpload {
    id: string;
    bookId: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes: number;
    pageStart: number;
    pageEnd: number;
    date: string;
}

export interface ReadingSessionsResult {
    accepted: number;
    inserted: number;
    skippedSessionIds: string[];
}

export interface ClientConfig {
    features: { communityLibrary: boolean };
}
