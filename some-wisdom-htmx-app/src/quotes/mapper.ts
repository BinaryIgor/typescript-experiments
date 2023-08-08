import { User } from "../user/domain";
import { QuoteNote } from "./domain";
import { QuoteNoteView } from "./views";

export function toQuoteNoteViews(quoteNotes: QuoteNote[], authors: Map<number, User>): QuoteNoteView[] {
    return quoteNotes.map(q => {
        const author = authors.get(q.noteAuthorId)?.name ?? "Anonymous";
        //TODO: prettier date format!
        const timestamp = new Date(q.timestamp).toUTCString();
        return new QuoteNoteView(q.noteId, q.quoteId, q.note, author, timestamp);
    });
}