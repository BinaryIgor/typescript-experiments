import { Errors, AppError, ErrorCode } from "./errors";
import * as Validator from "./validator";

const MIN_NOTE_LENGTH = 3;
const MAX_NOTE_LENGTH = 1000;
const MIN_AUTHOR_LENGTH = 3;
const MAX_AUTHOR_LENGTH = 50;

export class QuoteNoteInput {
    constructor(readonly note: string, readonly author: string) { }
}

export class QuoteNotesService {

    constructor(private readonly repository: QuoteNotesRepository) { }

    //TODO: better validation!
    addNote(quoteNote: QuoteNote) {
        const errors = [];

        const quoteError = this.validateQuoteNote(quoteNote.note);
        const authorError = this.validateQuoteAuthor(quoteNote.noteAuthor);

        AppError.throwIfThereAreErrors(quoteError, authorError);

        this.repository.create(quoteNote);
    }

    validateQuoteNote(note: string): ErrorCode | null {
        return Validator.hasAnyContent(note) && Validator.hasLength(note, MIN_NOTE_LENGTH, MAX_NOTE_LENGTH) ?
            null : Errors.INVALID_QUOTE_NOTE_CONTENT;
    }


    validateQuoteAuthor(author: string): ErrorCode | null {
        return Validator.hasAnyContent(author) && Validator.hasLength(author, MIN_AUTHOR_LENGTH, MAX_AUTHOR_LENGTH) ?
            null : Errors.INVALID_QUOTE_NOTE_AUTHOR;
    }

    notesOfQuote(quoteId: number): QuoteNote[] {
        return this.repository.allOfQuote(quoteId);
    }

    notesOfQuoteCount(quoteId: number): number {
        return this.repository.allOfQuote(quoteId).length;
    }
}

export interface QuoteNotesRepository {

    create(note: QuoteNote): void;

    allOfQuote(quoteId: number): QuoteNote[];
}

export class InMemoryQuoteNotesRepository implements QuoteNotesRepository {

    private readonly notes = new Map<number, QuoteNote[]>();

    create(note: QuoteNote): void {
        const notes = this.allOfQuote(note.quoteId);
        notes.push(note);

        this.notes.set(note.quoteId, notes);
    }

    allOfQuote(quoteId: number): QuoteNote[] {
        return this.notes.get(quoteId) ?? [];
    }

}

export class QuoteNote {
    constructor(readonly quoteId: number,
        readonly note: string,
        readonly noteAuthor: string,
        readonly timestamp: number) { }
}