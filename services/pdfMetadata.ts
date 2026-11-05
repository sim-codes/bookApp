import { PDFDocument } from 'pdf-lib';

export interface PdfMetadata {
    title?: string;
    author?: string;
    subjects: string[];
}

// Authoring tools often write placeholders or the source file name instead of a real title.
const PLACEHOLDER_TITLE = /^(untitled|document\d*|microsoft word - .*|.*\.(docx?|pdf|odt|rtf|txt|pages))$/i;

const clean = (value: string | undefined): string | undefined => value?.replace(/\s+/g, ' ').trim() || undefined;

/** Reads the title, author and subject keywords stored in a PDF's document properties. */
export async function readPdfMetadata(bytes: Uint8Array): Promise<PdfMetadata> {
    const document = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        updateMetadata: false,
        throwOnInvalidObject: false,
    });

    const title = clean(document.getTitle());
    return {
        title: title && !PLACEHOLDER_TITLE.test(title) ? title : undefined,
        author: clean(document.getAuthor()),
        subjects: [document.getSubject(), document.getKeywords()].map(clean).filter((s): s is string => !!s),
    };
}
