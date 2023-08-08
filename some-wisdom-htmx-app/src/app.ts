import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import * as FilesDb from "./files-db";
import * as Views from "./shared/views";
import { QuoteNotesService, InMemoryQuoteNotesRepository, QuoteNoteInput, NewQuoteNote } from "./quote-notes";
import { AppError, ErrorCode, Errors } from "./shared/errors";
import { UserService, UserSignInInput } from "./user/domain";
import { AuthSessions, AuthUser } from "./auth/auth";
import * as ViewMapper from "./view-mapper";
import * as Web from "./shared/web";
import { currentUser, setCurrentUser, SessionCookies, currentUserOrThrow, currentUserName } from "./auth/web";
import * as AuthorsModule from "./authors/module";
import * as UserModule from "./user/module";

const SERVER_PORT = 8080;

const SEARCH_AUTHORS_ENDPOINT = "/search-authors";
const AUTHORS_ENDPOINT = "/authors";
const QUOTES_ENDPOINT = "/quotes";
const QUOTE_NOTES_ENDPOINT_PART = "notes";
const QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT = `${QUOTES_ENDPOINT}/validate-note`;
const QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT = `${QUOTES_ENDPOINT}/validate-author`;
const QUOTE_NOTES_SUMMARY_ENDPOINT_PART = "notes-summary";

//5 hours;
const sessionDuration = 5 * 60 * 60 * 1000;
const sessionsDir = path.join("/tmp", "session");

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

const authSessions = new AuthSessions(sessionsDir, sessionDuration, 60 * 1000);
const sessionCookies = new SessionCookies(sessionDuration, "session-id", false);

const quoteNotesRepository = new InMemoryQuoteNotesRepository();
const quoteNotesService = new QuoteNotesService(quoteNotesRepository);

const dbPath = path.join(__dirname, "static", "db");
const quoteNotesDbPath = path.join(dbPath, "__quote-notes.json");

//TODO: fix deps tree!

const authorsModule = AuthorsModule.build(qid => `${QUOTES_ENDPOINT}/${qid}`);
const userModule = UserModule.build(authSessions, sessionCookies, authorsModule.returnHomePage);

staticFileContentOfPath(path.join(dbPath, "authors.json"))
    .then(db => FilesDb.importAuthors(db, authorsModule.client))
    .catch(e => console.log("Failed to load authors db!", e));

staticFileContentOfPath(path.join(dbPath, "users.json"))
    .then(db => FilesDb.importUsers(db, userModule.client))
    .catch(e => console.log("Failed to load users db!", e));

staticFileContentOfPath(quoteNotesDbPath)
    .then(db => FilesDb.importQuoteNotes(db, quoteNotesRepository))
    .catch(e => console.log("Failed to load (optional!) quote notes db!", e));



const STATIC_ASSETS_PATH = path.join(__dirname, "static");

const STYLES_PATH = function () {
    const stylesPath = process.env.STYLES_PATH;
    if (stylesPath) {
        console.log(`Styles path overriden, taking them from: ${staticFileContent}`);
        return stylesPath;
    } else {
        return path.join(STATIC_ASSETS_PATH, "style.css");
    }
}();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Weak etags are added by default
app.set('etag', false);

app.use(Web.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const session = sessionCookies.sessionFromCookie(req);
    let user: AuthUser | null;

    if (session) {
        user = await authSessions.authenticate(session);
        console.log("user of session...", user);
    } else {
        user = null;
    }

    if (user) {
        setCurrentUser(req, user);
    }

    if (isPublicRequest(req) || user) {
        console.log("Request is public or we have a user!", user);
        if (user && session && await authSessions.shouldRefresh(session)) {
            await authSessions.refresh(session);
            sessionCookies.setCookie(res, session);
        }
        next();
    } else {
        res.redirect(userModule.signInEndpoint);
    }
}));

function isPublicRequest(req: Request): boolean {
    return req.path.startsWith("/user") ||
        req.path.includes(".css") || req.path.includes(".js") || req.path.includes(".ico");
}

app.use(userModule.router);
app.use(authorsModule.router);

//TODO: fix it!
// app.get(`${QUOTES_ENDPOINT}/:id`, (req: Request, res: Response) => {
//     const quoteId = parseInt(req.params.id);

//     const quote = quotes.ofId(quoteId);
//     if (quote) {
//         const { notes, deleteableNoteIds } = quoteNoteViews(currentUserOrThrow(req).id, quoteId);
//         Web.returnHtml(res, Views.authorQuotePage({
//             author: quote.author,
//             quote: quote.content,
//             notes: notes,
//             deletableNoteIds: deleteableNoteIds,
//             deleteQuoteNoteEndpoint: deleteQuoteNoteEndpoint,
//             getQuotesNotesSummaryEndpoint: getQuoteNotesSummaryEndpoint(quoteId),
//             addQuoteNoteEndpoint: addQuoteNoteEndpoint(quoteId),
//             validateQuoteNoteEndpoint: QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT,
//             validateQuoteAuthorEndpoint: QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT,
//             renderFullPage: Web.shouldReturnFullPage(req),
//             currentUser: currentUserName(req)
//         }));
//     } else {
//         Web.returnNotFound(res);
//     }
// });

function quoteNoteViews(currentUserId: number, quoteId: number): { notes: Views.QuoteNoteView[], deleteableNoteIds: number[] } {
    const notes = quoteNotesService.notesOfQuoteSortedByTimestamp(quoteId);
    const authorIds = notes.map(n => n.noteAuthorId);
    const authors = userModule.client.usersOfIds(authorIds);

    const deleteableNoteIds = notes.filter(n => n.noteAuthorId == currentUserId).map(n => n.noteId);

    return { notes: ViewMapper.toQuoteNoteViews(notes, authors), deleteableNoteIds }
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

app.post(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_ENDPOINT_PART}`, (req: Request, res: Response) => {
    const quoteId = parseInt(req.params.id);

    const input = req.body as QuoteNoteInput;
    const author = currentUserOrThrow(req);

    const note = new NewQuoteNote(quoteId, input.note, author.id, Date.now());

    quoteNotesService.addNote(note);

    const { notes: newNotes, deleteableNoteIds } = quoteNoteViews(author.id, quoteId);

    Web.returnHtml(res, Views.quoteNotesPage(newNotes, deleteableNoteIds, deleteQuoteNoteEndpoint),
        Views.resetFormTrigger(Views.LABELS.quoteNoteForm,
            Views.additionalTrigersOfKeys(Views.TRIGGERS.getNotesSummary)));
});

app.get(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_SUMMARY_ENDPOINT_PART}`, (req: Request, res: Response) => {
    const quoteId = req.params.id as any as number;
    Web.returnHtml(res, Views.quoteNotesSummaryComponent(quoteNotesService.notesOfQuoteCount(quoteId)));
});

app.post(QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT, (req: Request, res: Response) => {
    const input = req.body as QuoteNoteInput;
    const noteError = quoteNotesService.validateQuoteNote(input.note);
    Web.returnHtml(res, Views.inputErrorIf(noteError),
        Views.formValidatedTrigger(Views.LABELS.quoteNoteForm,
            noteError == null));
});

app.delete(`${QUOTES_ENDPOINT}/${QUOTE_NOTES_ENDPOINT_PART}/:id`, (req: Request, res: Response) => {
    const quoteNoteId = parseInt(req.params.id);

    const author = currentUserOrThrow(req);

    quoteNotesService.deleteNote(quoteNoteId, author.id);

    Web.returnHtml(res, "", Views.TRIGGERS.getNotesSummary);
});

app.get("/", authorsModule.returnHomePage);
app.get("/index.html", authorsModule.returnHomePage);

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url.includes("style")) {
        Web.returnCss(res, await staticFileContentOfPath(STYLES_PATH));
    } else if (req.url.includes(".js")) {
        const fileName = req.url.substring(req.url.lastIndexOf("/"));
        Web.returnJs(res, await staticFileContentOfPath(path.join(STATIC_ASSETS_PATH, fileName)));
    } else {
        Web.returnNotFound(res);
    }
})

function staticFileContent(filename: string): Promise<string> {
    return staticFileContentOfPath(path.join(__dirname, "static", filename));
}

function staticFileContentOfPath(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf-8');
}

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Something went wrong...", error);
    //TODO: refactor!
    let status: number;
    let errors: ErrorCode[]
    if (error instanceof AppError) {
        status = appErrorStatus(error);
        errors = error.errors;
    } else {
        status = 500;
        //TODO: maybe more details
        errors = ["UNKOWN_ERROR"];
    }
    res.status(status);
    Web.returnHtml(res, Views.errorPage(errors, Web.shouldReturnFullPage(req), currentUserName(req)));
});

function appErrorStatus(error: AppError): number {
    for (let e of error.errors) {
        if (e == Errors.NOT_AUTHENTICATED) {
            return 401;
        }
        if (e == Errors.INCORRECT_USER_PASSWORD) {
            return 403;
        }
        if (e.includes("NOT_FOUND")) {
            return 404;
        }
    }
    return 400;
}

const server = app.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
    console.log("Shutting down, dumping quote notes...");

    FilesDb.dumpQuoteNotes(quoteNotesDbPath, quoteNotesRepository)
        .then(() => console.log("Quote notes saved!"))
        .catch(e => {
            console.log("Problem while dumping quote notes to a file...", e);
        })
        .then(() => {
            server.close(() => {
                console.log("Server closed!");
            });
        });
}