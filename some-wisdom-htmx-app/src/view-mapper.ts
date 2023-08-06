import { QuoteNoteView } from "./shared/views";
import { QuoteNote } from "./quote-notes";
import { User } from "./user/domain";

export function toQuoteNoteViews(quoteNotes: QuoteNote[], authors: Map<number, User>): QuoteNoteView[] {
    return quoteNotes.map(q => {
        const author = authors.get(q.noteAuthorId)?.name ?? "Anonymous";
        //TODO: format!
        const timestamp = new Date(q.timestamp).toUTCString();
        return new QuoteNoteView(q.noteId, q.quoteId, q.note, author, timestamp);
    });
}