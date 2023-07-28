import { Errors, AppError, ErrorCode } from "./errors";
import * as Validator from "./validator";

const MIN_NOTE_LENGTH = 3;
const MAX_NOTE_LENGTH = 1000;
const MIN_AUTHOR_LENGTH = 3;
const MAX_AUTHOR_LENGTH = 50;

export class QuoteNotes {

    private readonly notes = new Map<number, QuoteNote[]>();

    //TODO: better validation!
    addNote(quote: QuoteNote) {
        const errors = [];

        const quoteError = this.validateQuoteNote(quote.note);
        const authorError = this.validateQuoteAuthor(quote.noteAuthor);

        if (quoteError) {
            errors.push(quoteError);
        }
        if (authorError) {
            errors.push(authorError);
        }

        if (errors) {
            throw new AppError(errors);
        }
        //TODO: add note!
    }

    validateQuoteNote(note: string): ErrorCode | null {
        return Validator.hasAnyContent(note) && Validator.hasLength(note, MIN_NOTE_LENGTH, MAX_NOTE_LENGTH) ?
            null : Errors.INVALID_QUOTE_NOTE_CONTENT;
    }


    validateQuoteAuthor(author: string): ErrorCode | null {
        return Validator.hasAnyContent(author) && Validator.hasLength(author, MIN_AUTHOR_LENGTH, MAX_AUTHOR_LENGTH) ?
             null : Errors.INVALID_QUOTE_NOTE_AUTHOR;
    }

    //TODO: implement!
    notesOfQuote(quoteId: number): QuoteNote[] {
        return [];
    }

}

export class QuoteNote {
    constructor(readonly quoteId: number,
        readonly note: string,
        readonly noteAuthor: string,
        readonly timestamp: number) { }
}