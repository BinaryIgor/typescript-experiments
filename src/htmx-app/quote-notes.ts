export class QuoteNotes {

    private readonly notes = new Map<number, QuoteNote[]>();

    //TODO: check if quote exist
    addNote(quote: QuoteNote) {

    }

    //TODO: implement!
    notesOfQuote(quoteId: number): QuoteNote[] {
        return [];
    }

}

export class QuoteNote {
    constructor(readonly quoteId: number,
        readonly note: string,
        readonly timestamp: number,
        readonly noteAuthor: string) { }
}