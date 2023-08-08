
import { Router, Request, Response } from "express";
import * as Web from "../shared/web";
import * as Views from "../shared/views";
import * as QuoteViews from "./views";
import { QuoteNoteView } from "./views";
import * as AuthWeb from "../auth/web";
import { Quote } from "../authors/domain";
import { InMemoryQuoteNoteRepository } from "./repository";
import { NewQuoteNote, QuoteNote, QuoteNoteService } from "./domain";
import * as Mapper from "./mapper";
import { User } from "../user/domain";

const QUOTES_ENDPOINT = "/quotes";
const QUOTE_NOTES_ENDPOINT_PART = "notes";
const QUOTES_NOTES_PREFIX = `${QUOTES_ENDPOINT}/${QUOTE_NOTES_ENDPOINT_PART}`
const QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT = `${QUOTES_NOTES_PREFIX}/validate-note`;
const QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT = `${QUOTES_NOTES_PREFIX}/validate-author`;
const QUOTE_NOTES_SUMMARY_ENDPOINT_PART = `summary`;

export function quoteEndpoint(quoteId: number): string {
    return `${QUOTES_ENDPOINT}/${quoteId}`;
}

export function build(
    quoteOfId: (quoteId: number) => Quote | null,
    usersOfIds: (ids: number[]) => Map<number, User>): QuoteModule {
    const quoteNoteRepository = new InMemoryQuoteNoteRepository();
    const quoteNoteService = new QuoteNoteService(quoteNoteRepository);

    const router = Router()

    //TODO: fix it!
    router.get(`${QUOTES_ENDPOINT}/:id`, (req: Request, res: Response) => {
        const quoteId = parseInt(req.params.id);

        const quote = quoteOfId(quoteId);
        if (quote) {
            const { notes, deleteableNoteIds } = quoteNoteViews(AuthWeb.currentUserOrThrow(req).id, quoteId);
            Web.returnHtml(res, QuoteViews.quotePage({
                author: quote.author,
                quote: quote.content,
                notes: notes,
                deletableNoteIds: deleteableNoteIds,
                deleteQuoteNoteEndpoint: deleteQuoteNoteEndpoint,
                getQuotesNotesSummaryEndpoint: getQuoteNotesSummaryEndpoint(quoteId),
                addQuoteNoteEndpoint: addQuoteNoteEndpoint(quoteId),
                validateQuoteNoteEndpoint: QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT,
                validateQuoteAuthorEndpoint: QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT,
                renderFullPage: Web.shouldReturnFullPage(req),
                currentUser: AuthWeb.currentUserName(req)
            }));
        } else {
            Web.returnNotFound(res);
        }
    });

    function quoteNoteViews(currentUserId: number, quoteId: number): { notes: QuoteNoteView[], deleteableNoteIds: number[] } {
        const notes = quoteNoteService.notesOfQuoteSortedByTimestamp(quoteId);
        const authorIds = notes.map(n => n.noteAuthorId);
        const authors = usersOfIds(authorIds);

        const deleteableNoteIds = notes.filter(n => n.noteAuthorId == currentUserId).map(n => n.noteId);

        return { notes: Mapper.toQuoteNoteViews(notes, authors), deleteableNoteIds }
    }

    function getQuoteNotesSummaryEndpoint(quoteId: number): string {
        return `${QUOTES_ENDPOINT}/${quoteId}/${QUOTE_NOTES_SUMMARY_ENDPOINT_PART}`;
    }

    function addQuoteNoteEndpoint(quoteId: number): string {
        return `${QUOTES_ENDPOINT}/${quoteId}/${QUOTE_NOTES_ENDPOINT_PART}`;
    }

    function deleteQuoteNoteEndpoint(noteId: number): string {
        return `${QUOTES_ENDPOINT}/${QUOTE_NOTES_ENDPOINT_PART}/${noteId}`;
    }

    router.post(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_ENDPOINT_PART}`, (req: Request, res: Response) => {
        const quoteId = parseInt(req.params.id);

        const input = req.body as QuoteNoteInput;
        const author = AuthWeb.currentUserOrThrow(req);

        const note = new NewQuoteNote(quoteId, input.note, author.id, Date.now());

        quoteNoteService.createNote(note);

        const { notes: newNotes, deleteableNoteIds } = quoteNoteViews(author.id, quoteId);

        Web.returnHtml(res, QuoteViews.quoteNotesPage(newNotes, deleteableNoteIds, deleteQuoteNoteEndpoint),
            Views.resetFormTrigger(QuoteViews.LABELS.quoteNoteForm,
                Views.additionalTrigersOfKeys(QuoteViews.TRIGGERS.getNotesSummary)));
    });

    router.get(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_SUMMARY_ENDPOINT_PART}`, (req: Request, res: Response) => {
        const quoteId = req.params.id as any as number;
        Web.returnHtml(res, QuoteViews.quoteNotesSummaryComponent(quoteNoteService.notesOfQuoteCount(quoteId)));
    });

    router.post(QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT, (req: Request, res: Response) => {
        const input = req.body as QuoteNoteInput;
        const noteError = quoteNoteService.validateQuoteNote(input.note);
        Web.returnHtml(res, Views.inputErrorIf(noteError),
            Views.formValidatedTrigger(QuoteViews.LABELS.quoteNoteForm,
                noteError == null));
    });

    router.delete(`${QUOTES_ENDPOINT}/${QUOTE_NOTES_ENDPOINT_PART}/:id`, (req: Request, res: Response) => {
        const quoteNoteId = parseInt(req.params.id);

        const author = AuthWeb.currentUserOrThrow(req);

        quoteNoteService.deleteNote(quoteNoteId, author.id);

        Web.returnHtml(res, "", QuoteViews.TRIGGERS.getNotesSummary);
    });

    return new QuoteModule(router, {
        createQuoteNote(quoteNote: NewQuoteNote) {
            quoteNoteRepository.create(quoteNote);
        },
        allQuoteNotes(): QuoteNote[] {
            return quoteNoteRepository.allNotes();
        }
    });
}

class QuoteNoteInput {
    constructor(readonly note: string) { }
}

export class QuoteModule {
    constructor(readonly router: Router, readonly client: QuoteClient) { }
}

export interface QuoteClient {

    createQuoteNote(quoteNote: NewQuoteNote): void

    allQuoteNotes(): QuoteNote[];
}