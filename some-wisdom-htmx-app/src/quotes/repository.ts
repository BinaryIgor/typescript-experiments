import { NewQuoteNote, QuoteNote, QuoteNoteRepository } from "./domain";

export class InMemoryQuoteNoteRepository implements QuoteNoteRepository {

    private readonly notes = new Map<number, QuoteNote>();
    private nextQuoteNoteId: number = 1;

    create(newNote: NewQuoteNote): number {
        const note = new QuoteNote(this.nextQuoteNoteId, newNote.quoteId, newNote.note, newNote.noteAuthorId, newNote.timestamp);
        this.nextQuoteNoteId++;

        this.notes.set(note.noteId, note);

        return note.noteId;
    }

    ofId(noteId: number): QuoteNote | null {
        return this.notes.get(noteId) ?? null;
    }

    allOfQuote(quoteId: number): QuoteNote[] {
        return [...this.notes.values()].filter(n => n.quoteId == quoteId);
    }

    allNotes(): QuoteNote[] {
        return [...this.notes.values()];
    }

    delete(noteId: number): void {
        this.notes.delete(noteId);
    }
}