import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import { Author, Authors } from "./authors";
import { Quote, Quotes } from "./quotes";
import * as FilesDb from "./files-db";
import * as Pages from "./pages";
import { QuoteNotesService, QuoteNote, InMemoryQuoteNotesRepository, QuoteNoteInput } from "./quote-notes";
import { AppError, ErrorCode, Errors } from "./errors";
import { Base64PasswordHasher, InMemoryUserRepository, UserService, UserSignInInput } from "./users";
import { AuthSessions, AuthUser } from "./auth";
import * as ViewMapper from "./view-mapper";

const SERVER_PORT = 8080;

const HTMX_REQUEST_HEADER = "hx-request";
const HTMX_RESTORE_HISTORY_REQUEST = "hx-history-restore-request";

const SESSION_COOKIE = "session-id";

const SIGN_IN_ENDPOINT = "/sign-in";
const SIGN_IN_EXECUTE_ENDPOINT = `${SIGN_IN_ENDPOINT}/execute`;
const SIGN_IN_VALIDATE_NAME_ENDPOINT = `${SIGN_IN_ENDPOINT}/validate-name`;
const SIGN_IN_VALIDATE_PASSWORD_ENDPOINT = `${SIGN_IN_ENDPOINT}/validate-password`;

const SEARCH_AUTHORS_ENDPOINT = "/search-authors";
const AUTHORS_ENDPOINT = "/authors";
const QUOTES_ENDPOINT = "/quotes";
const QUOTE_NOTES_ENDPOINT_PART = "notes";
const QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT = `${QUOTES_ENDPOINT}/validate-note`;
const QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT = `${QUOTES_ENDPOINT}/validate-author`;
const QUOTE_NOTES_SUMMARY_ENDPOINT_PART = "notes-summary";

const HX_TRIGGER_HEADER = "HX-Trigger";

const userRepository = new InMemoryUserRepository();

const passwordHasher = new Base64PasswordHasher();
const userService = new UserService(userRepository, passwordHasher);

//5 hours;
const sessionDuration = 5 * 60 * 60 * 1000;
const sessionsDir = path.join("/tmp", "session");

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

const authSessions = new AuthSessions(sessionsDir, sessionDuration, 60 * 1000);

const authors = new Authors();
const quotes = new Quotes();

const quoteNotesRepository = new InMemoryQuoteNotesRepository();
const quoteNotesService = new QuoteNotesService(quoteNotesRepository);

const dbPath = path.join(__dirname, "static", "db");
const quoteNotesDbPath = path.join(dbPath, "__quote-notes.json");

staticFileContentOfPath(path.join(dbPath, "authors-with-quotes.json"))
    .then(db => FilesDb.importAuthorsWithQuotes(db, authors, quotes))
    .catch(e => console.log("Failed to load authors db!", e));

staticFileContentOfPath(path.join(dbPath, "users.json"))
    .then(db => FilesDb.importUsers(db, userRepository))
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

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
}

app.use(asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    console.log("Just intercepting every single request with cookie", req.path, req.headers);

    const session = cookieValue(req, SESSION_COOKIE);
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
            setSessionCookie(res, session);
        }
        next();
    } else {
        res.redirect(SIGN_IN_ENDPOINT);
    }
}));

function setCurrentUser(req: any, user: AuthUser) {
    req.user = user;
}

function currentUser(req: any): AuthUser | null {
    return req.user as AuthUser;
}

function currentUserOrThrow(req: any): AuthUser {
    const user = currentUser(req);
    if (!user) {
        throw AppError.ofSingleError(Errors.NOT_AUTHENTICATED);
    }
    return user;
}

function currentUserName(req: any): string | null {
    return currentUser(req)?.name ?? null;
}

function cookieValue(req: Request, cookie: string): string | null {
    const cookiesHeader = req.headers.cookie;
    if (!cookiesHeader) {
        return null;
    }
    const cookies = cookiesHeader.split(';');
    for (let c of cookies) {
        const kv = c.split("=", 2);
        if (kv.length != 2) {
            continue;
        }
        const k = kv[0].trim();
        const v = kv[1].trim();
        if (k == cookie) {
            return v;
        }
    }

    return null;
}

function isPublicRequest(req: Request): boolean {
    return req.path.startsWith(SIGN_IN_ENDPOINT) ||
        req.path.includes(".css") || req.path.includes(".js") || req.path.includes(".ico");
}

app.get(SIGN_IN_ENDPOINT, (req: Request, res: Response) => {
    returnHtml(res,
        Pages.signInPage(SIGN_IN_EXECUTE_ENDPOINT, SIGN_IN_VALIDATE_NAME_ENDPOINT, SIGN_IN_VALIDATE_PASSWORD_ENDPOINT,
            shouldReturnFullPage(req)));
});

app.post(SIGN_IN_VALIDATE_NAME_ENDPOINT, (req: Request, res: Response) => {
    const { nameError, passwordError } = validateSignInInput(req);
    returnHtml(res, Pages.inputErrorIf(nameError),
        hxFormValidatedTrigger(Pages.LABELS.signInForm,
            nameError == null && passwordError == null));
});

function validateSignInInput(req: Request) {
    const input = req.body as UserSignInInput;
    const nameError = userService.validateUserName(input.name);
    const passwordError = userService.validateUserPassword(input.password);
    return { nameError, passwordError };
}

app.post(SIGN_IN_VALIDATE_PASSWORD_ENDPOINT, (req: Request, res: Response) => {
    const { nameError, passwordError } = validateSignInInput(req);
    returnHtml(res, Pages.inputErrorIf(passwordError),
        hxFormValidatedTrigger(Pages.LABELS.signInForm,
            nameError == null && passwordError == null));
});

app.post(SIGN_IN_EXECUTE_ENDPOINT, asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as UserSignInInput;
    const user = userService.signIn(input.name, input.password);

    const session = await authSessions.create(user);

    setSessionCookie(res, session);

    setTriggerHeader(res, Pages.TRIGGERS.showNavigation);

    returnHomePage(req, res);
}));

function setSessionCookie(res: Response, session: string) {
    res.setHeader('Set-Cookie', sessionCookie(session));
}

function sessionCookie(session: string, httpsOnly: boolean = false): string {
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + sessionDuration);

    let cookie = `${SESSION_COOKIE}=${session}; HttpOnly; SameSite=Strict; Path=/; Expires=${expiresAt.toUTCString()}`;
    if (httpsOnly) {
        cookie = cookie + `; Secure`;
    }

    return cookie;
}

app.get("/current-user", (req: Request, res: Response) => {
    returnHtml(res, Pages.navigationComponent(currentUserName(req)));
});

app.post(SEARCH_AUTHORS_ENDPOINT, (req: Request, res: Response) => {
    console.log("Searching fo authors...", req.body);

    const query = req.body[Pages.AUTHORS_SEARCH_INPUT];

    const foundAuthors = authors.search(query);
    //TODO: search quotes!

    //Slow it down, for demonstration purposes
    setTimeout(() => returnHtml(res,
        Pages.authorsSearchResult(foundAuthors, (a: Author) => `${AUTHORS_ENDPOINT}/${a.name}`)),
        1000);
});

app.get(`${AUTHORS_ENDPOINT}/:name`, (req: Request, res: Response) => {
    const name = req.params.name;
    console.log("Getting author:", name);

    const author = authors.ofName(name);
    const authorQuotes = quotes.ofAuthor(name);
    if (author) {
        returnHtml(res, Pages.authorPage(author, authorQuotes,
            (qId: number) => `${QUOTES_ENDPOINT}/${qId}`,
            shouldReturnFullPage(req),
            currentUserName(req)));
    } else {
        returnNotFound(res);
    }
});

app.get(`${QUOTES_ENDPOINT}/:id`, (req: Request, res: Response) => {
    const quoteId = req.params.id as any as number;

    const quote = quotes.ofId(quoteId);
    if (quote) {
        returnHtml(res, Pages.authorQuotePage({
            author: quote.author,
            quote: quote.content,
            notes: quoteNoteViews(quoteId),
            getQuotesNotesSummaryEndpoint: getQuoteNotesSummaryEndpoint(quoteId),
            addQuoteNoteEndpoint: addQuoteNoteEndpoint(quoteId),
            validateQuoteNoteEndpoint: QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT,
            validateQuoteAuthorEndpoint: QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT,
            renderFullPage: shouldReturnFullPage(req),
            currentUser: currentUserName(req)
        }));
    } else {
        returnNotFound(res);
    }
});

function quoteNoteViews(quoteId: number): Pages.QuoteNoteView[] {
    const notes = quoteNotesService.notesOfQuoteSortedByTimestamp(quoteId);
    const authorIds = notes.map(n => n.noteAuthorId);
    const authors = userService.usersOfIds(authorIds);

    return ViewMapper.toQuoteNoteViews(notes, authors);
}

function getQuoteNotesSummaryEndpoint(quoteId: number): string {
    return `${QUOTES_ENDPOINT}/${quoteId}/${QUOTE_NOTES_SUMMARY_ENDPOINT_PART}`;
}

function addQuoteNoteEndpoint(quoteId: number): string {
    return `${QUOTES_ENDPOINT}/${quoteId}/${QUOTE_NOTES_ENDPOINT_PART}`;
}

app.post(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_ENDPOINT_PART}`, (req: Request, res: Response) => {
    const quoteId = req.params.id as any as number;

    const input = req.body as QuoteNoteInput;
    const author = currentUserOrThrow(req);

    const note = new QuoteNote(quoteId, input.note, author.id, Date.now());

    quoteNotesService.addNote(note);
    returnHtml(res, Pages.quoteNotesPage(quoteNoteViews(quoteId)),
        hxResetFormTrigger(Pages.LABELS.quoteNoteForm,
            hxAdditionalTrigersOfKeys(Pages.TRIGGERS.getNotesSummary)));
});

app.get(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_SUMMARY_ENDPOINT_PART}`, (req: Request, res: Response) => {
    const quoteId = req.params.id as any as number;
    returnHtml(res, Pages.quoteNotesSummaryComponent(quoteNotesService.notesOfQuoteCount(quoteId)));
});

app.post(QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT, (req: Request, res: Response) => {
    const input = req.body as QuoteNoteInput;
    const noteError = quoteNotesService.validateQuoteNote(input.note);
    returnHtml(res, Pages.inputErrorIf(noteError),
        hxFormValidatedTrigger(Pages.LABELS.quoteNoteForm,
            noteError == null));
});

app.get("/", (req: Request, res: Response) => returnHomePage(req, res));
app.get("/index.html", (req: Request, res: Response) => returnHomePage(req, res));

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url.includes("style")) {
        returnCss(res, await staticFileContentOfPath(STYLES_PATH));
    } else if (req.url.includes(".js")) {
        const fileName = req.url.substring(req.url.lastIndexOf("/"));
        returnJs(res, await staticFileContentOfPath(path.join(STATIC_ASSETS_PATH, fileName)));
    } else {
        returnNotFound(res);
    }
})

function staticFileContent(filename: string): Promise<string> {
    return staticFileContentOfPath(path.join(__dirname, "static", filename));
}

function staticFileContentOfPath(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf-8');
}

async function returnCss(res: Response, css: string) {
    res.contentType("text/css");
    res.send(css);
}

async function returnJs(res: Response, js: string) {
    res.contentType("application/javascript");
    res.send(js);
}

function returnHomePage(req: Request, res: Response) {
    returnHtml(res, Pages.homePage(authors.random(3).map(a => a.name), SEARCH_AUTHORS_ENDPOINT,
        shouldReturnFullPage(req), currentUserName(req)));
}

function returnHtml(res: Response, html: string, hxTrigger: string | null = null) {
    res.contentType("text/html");
    if (hxTrigger) {
        setTriggerHeader(res, hxTrigger);
    }
    res.send(html);
}

function setTriggerHeader(res: Response, trigger: string) {
    res.setHeader(HX_TRIGGER_HEADER, trigger);
}

function hxFormValidatedTrigger(formLabel: string, valid: boolean) {
    return JSON.stringify({
        "form-validated": {
            "label": formLabel,
            "valid": valid
        }
    });
}

function hxResetFormTrigger(label: string, additionalTriggers: any): string {
    return JSON.stringify({
        "reset-form": label,
        ...additionalTriggers
    });
}

function hxAdditionalTrigersOfKeys(...keys: string[]): any {
    const jsonBody = [...keys].map(k => `"${k}": true`).join(",\n");
    return JSON.parse(`{ ${jsonBody} }`);
}

function shouldReturnFullPage(req: Request): boolean {
    return (req.headers[HTMX_REQUEST_HEADER] ? false : true) &&
        (req.headers[HTMX_RESTORE_HISTORY_REQUEST] ? false : true)
}

function returnNotFound(res: Response) {
    res.sendStatus(404);
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
    returnHtml(res, Pages.errorPage(errors, shouldReturnFullPage(req), currentUserName(req)));
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