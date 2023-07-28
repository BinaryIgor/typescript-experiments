export type ErrorCode = string;

export const Errors = {
    INVALID_QUOTE_NOTE_CONTENT: "INVALID_QUOTE_NOTE_CONTENT",
    INVALID_QUOTE_NOTE_AUTHOR: "INVALID_QUOTE_NOTE_AUTHOR"
};


export class AppError extends Error {
    constructor(readonly errors: ErrorCode[], 
        readonly message: string = `There were ${errors.length}`) {
        super(message)
    }
}