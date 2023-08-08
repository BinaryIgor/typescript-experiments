import { Errors, AppError, OptionalErrorCode } from "../shared/errors";
import * as Validator from "../shared/validator";

const MIN_NOTE_LENGTH = 3;
const MAX_NOTE_LENGTH = 1000;

export class QuoteNoteService {

    constructor(private readonly repository: QuoteNoteRepository) { }

    //TODO: better validation!
    createNote(quoteNote: NewQuoteNote) {
        const quoteError = this.validateQuoteNote(quoteNote.note);
        AppError.throwIfThereAreErrors(quoteError);

        this.repository.create(quoteNote);
    }

    validateQuoteNote(note: string): OptionalErrorCode {
        return Validator.hasAnyContent(note) && Validator.hasLength(note, MIN_NOTE_LENGTH, MAX_NOTE_LENGTH) ?
            null : Errors.INVALID_QUOTE_NOTE_CONTENT;
    }

    notesOfQuoteSortedByTimestamp(quoteId: number, ascending: boolean = false): QuoteNote[] {
        function ascendingSort(a: QuoteNote, b: QuoteNote): number {
            if (a.timestamp > b.timestamp) {
                return 1;
            }
            if (b.timestamp > a.timestamp) {
                return -1;
            }
            return 0;
        }

        function descendingSort(a: QuoteNote, b: QuoteNote): number {
            if (a.timestamp > b.timestamp) {
                return -1;
            }
            if (b.timestamp > a.timestamp) {
                return 1;
            }
            return 0;
        }

        const sort = ascending ? ascendingSort : descendingSort;
        return this.repository.allOfQuote(quoteId).sort(sort);
    }

    notesOfQuoteCount(quoteId: number): number {
        return this.repository.allOfQuote(quoteId).length;
    }

    deleteNote(noteId: number, userId: number) {
        const note = this.repository.ofId(noteId);
        if (!note) {
            throw AppError.ofSingleError(Errors.QUOTE_NOTE_DOES_NOT_EXIST);
        }

        if (note.noteAuthorId != userId) {
            throw AppError.ofSingleError(Errors.NOT_USER_QUOTE_NOTE);
        }

        this.repository.delete(noteId);
    }
}

export interface QuoteNoteRepository {

    create(newNote: NewQuoteNote): number

    ofId(noteId: number): QuoteNote | null

    allOfQuote(quoteId: number): QuoteNote[]

    allNotes(): QuoteNote[]

    delete(noteId: number): void
}

export class NewQuoteNote {
    constructor(readonly quoteId: number,
        readonly note: string,
        readonly noteAuthorId: number,
        readonly timestamp: number) { }
}

export class QuoteNote {
    constructor(readonly noteId: number,
        readonly quoteId: number,
        readonly note: string,
        readonly noteAuthorId: number,
        readonly timestamp: number) { }
}