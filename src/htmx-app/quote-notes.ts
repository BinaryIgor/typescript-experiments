import { Errors, AppError, ErrorCode } from "./errors";
import * as Validator from "./validator";

const MIN_NOTE_LENGTH = 3;
const MAX_NOTE_LENGTH = 1000;
const MIN_AUTHOR_LENGTH = 3;
const MAX_AUTHOR_LENGTH = 50;

export class QuoteNoteInput {
    constructor(readonly note: string) { }
}

export class QuoteNotesService {

    constructor(private readonly repository: QuoteNotesRepository) { }

    //TODO: better validation!
    addNote(quoteNote: QuoteNote) {
        const quoteError = this.validateQuoteNote(quoteNote.note);
        AppError.throwIfThereAreErrors(quoteError);

        this.repository.create(quoteNote);
    }

    validateQuoteNote(note: string): ErrorCode | null {
        return Validator.hasAnyContent(note) && Validator.hasLength(note, MIN_NOTE_LENGTH, MAX_NOTE_LENGTH) ?
            null : Errors.INVALID_QUOTE_NOTE_CONTENT;
    }

    notesOfQuote(quoteId: number): QuoteNote[] {
        return this.repository.allOfQuote(quoteId);
    }

    notesOfQuoteCount(quoteId: number): number {
        return this.repository.allOfQuote(quoteId).length;
    }
}

export interface QuoteNotesRepository {

    create(note: QuoteNote): void

    allOfQuote(quoteId: number): QuoteNote[]

    allNotes(): QuoteNote[]
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

    allNotes(): QuoteNote[] {
        return [...this.notes.values()].flatMap(e => e);
    }
}

export class QuoteNote {
    constructor(readonly quoteId: number,
        readonly note: string,
        readonly noteAuthorId: number,
        readonly timestamp: number) { }
}