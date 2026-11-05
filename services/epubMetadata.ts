import { strFromU8, unzipSync } from 'fflate';

export interface EpubCover {
    bytes: Uint8Array;
    extension: string;
}

export interface EpubMetadata {
    title?: string;
    author?: string;
    subjects: string[];
    cover?: EpubCover;
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decodeXml = (text: string): string =>
    text
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&([a-z]+);/gi, (match, name) => XML_ENTITIES[name] ?? match)
        .trim();

const parseAttributes = (tag: string): Record<string, string> => {
    const attributes: Record<string, string> = {};
    for (const [, name, , value] of tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
        attributes[name.toLowerCase()] = value;
    }
    return attributes;
};

const elementTexts = (xml: string, name: string): string[] =>
    Array.from(xml.matchAll(new RegExp(`<(?:\\w+:)?${name}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${name}>`, 'gi')))
        .map(match => decodeXml(match[1]))
        .filter(Boolean);

const readEntry = (zip: Uint8Array, path: string): Uint8Array | undefined =>
    unzipSync(zip, { filter: file => file.name === path })[path];

const resolvePath = (baseDir: string, href: string): string => {
    const parts = `${baseDir}${decodeURIComponent(href.split('#')[0])}`.split('/');
    const resolved: string[] = [];
    for (const part of parts) {
        if (part === '..') resolved.pop();
        else if (part && part !== '.') resolved.push(part);
    }
    return resolved.join('/');
};

const findCoverHref = (opf: string): string | undefined => {
    const items = Array.from(opf.matchAll(/<item\b[^>]*>/gi)).map(match => parseAttributes(match[0]));

    const epub3Cover = items.find(item => item.properties?.split(/\s+/).includes('cover-image'));
    if (epub3Cover?.href) return epub3Cover.href;

    const coverMeta = Array.from(opf.matchAll(/<meta\b[^>]*>/gi))
        .map(match => parseAttributes(match[0]))
        .find(meta => meta.name === 'cover');
    const epub2Cover = coverMeta && items.find(item => item.id === coverMeta.content);
    if (epub2Cover?.href) return epub2Cover.href;

    return items.find(item => /cover/i.test(item.id ?? '') && item['media-type']?.startsWith('image/'))?.href;
};

/** Reads the title, author, subjects and embedded cover image from an EPUB's bytes. */
export function readEpubMetadata(zip: Uint8Array): EpubMetadata {
    const container = readEntry(zip, 'META-INF/container.xml');
    if (!container) return { subjects: [] };

    const opfPath = parseAttributes(strFromU8(container).match(/<rootfile\b[^>]*>/i)?.[0] ?? '')['full-path'];
    const opfBytes = opfPath ? readEntry(zip, opfPath) : undefined;
    if (!opfPath || !opfBytes) return { subjects: [] };

    const opf = strFromU8(opfBytes);
    const metadata: EpubMetadata = {
        title: elementTexts(opf, 'title')[0],
        author: elementTexts(opf, 'creator')[0],
        subjects: elementTexts(opf, 'subject'),
    };

    const coverHref = findCoverHref(opf);
    if (coverHref) {
        const coverPath = resolvePath(opfPath.slice(0, opfPath.lastIndexOf('/') + 1), coverHref);
        const bytes = readEntry(zip, coverPath);
        const extension = coverPath.split('.').pop()?.toLowerCase();
        if (bytes && extension) metadata.cover = { bytes, extension };
    }

    return metadata;
}
