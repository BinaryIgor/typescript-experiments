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

    static throwIfThereAreErrors(...errors: (ErrorCode | null)[]) {
        const definedErrors = [...errors].filter(e => e != null).map(e => e as ErrorCode);
        if (definedErrors.length > 0) {
            throw new AppError(definedErrors);
        }
    }
}   