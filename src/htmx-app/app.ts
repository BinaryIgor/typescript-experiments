import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { Author, Authors } from "./authors";
import { Quotes } from "./quotes";
import { importDb } from "./db-import";
import * as Pages from "./pages";
import { QuoteNotes, QuoteNote } from "./quote-notes";
import { AppError } from "./errors";

const SERVER_PORT = 8080;

const HTMX_REQUEST_HEADER = "hx-request";
const HTMX_RESTORE_HISTORY_REQUEST = "hx-history-restore-request";

const SEARCH_AUTHORS_ENDPOINT = "/search-authors";
const AUTHORS_ENDPOINT = "/authors";
const QUOTES_ENDPOINT = "/quotes";
const QUOTE_NOTES_ENDPOINT_PART = "notes";
const QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT = `${QUOTES_ENDPOINT}/validate-note`;
const QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT = `${QUOTES_ENDPOINT}/validate-author`;

const authors = new Authors();
const quotes = new Quotes();

const quoteNotes = new QuoteNotes();

staticFileContent("db.json")
    .then(db => importDb(db, authors, quotes))
    .catch(e => console.log("Failed to load authors db!", e));

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
            shouldReturnFullPage(req)));
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
            quoteId: quote.id,
            quote: quote.content,
            notes: [],
            addQuoteNoteEndpoint: (qId: number) => `${QUOTES_ENDPOINT}/${qId}/${QUOTE_NOTES_ENDPOINT_PART}`,
            validateQuoteNoteEndpoint: QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT,
            validateQuoteAuthorEndpoint: QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT,
            renderFullPage: shouldReturnFullPage(req)
        }));
    } else {
        returnNotFound(res);
    }
});

app.post(`${QUOTES_ENDPOINT}/:id/${QUOTE_NOTES_ENDPOINT_PART}`, (req: Request, res: Response) => {
    const quoteId = req.params.id as any as number;
    console.log("Req body...", req.body);

    const note = new QuoteNote(quoteId, req.body.note, req.body.author, Date.now());

    //TODO: global error handler
    try {
        quoteNotes.addNote(note);
    } catch(e) {
        if (e  instanceof AppError) {
            returnError(res, e);
        } else {
            throw e;
        }
    }

    returnNotFound(res);
});

app.post(QUOTE_NOTES_VALIDATE_NOTE_ENDPOINT, (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    const noteError = quoteNotes.validateQuoteNote(req.body.note);
    returnHtml(res, Pages.inputErrorIf(noteError), "input-validated");
});

app.post(QUOTE_NOTES_VALIDATE_AUTHOR_ENDPOINT, (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    const authorError = quoteNotes.validateQuoteAuthor(req.body.author);
    returnHtml(res, Pages.inputErrorIf(authorError), "input-validated");
});

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url.includes("style")) {
        returnCss(res, await staticFileContentOfPath(STYLES_PATH));
    } else if (req.url.includes(".js")) {
        const fileName = req.url.substring(req.url.lastIndexOf("/"));
        returnJs(res, await staticFileContentOfPath(path.join(STATIC_ASSETS_PATH, fileName)));
    } else {
        returnHomePage(res);
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

function returnHomePage(res: Response) {
    returnHtml(res, Pages.homePage(authors.random(3).map(a => a.name), SEARCH_AUTHORS_ENDPOINT));
}

function returnHtml(res: Response, html: string, hxTrigger: string | null = null) {
    res.contentType("text/html");
    if (hxTrigger) {
        res.setHeader("HX-Trigger", hxTrigger);
    }
    res.send(html);
}

function returnTextOrEmpty(res: Response, text: string | null) {
    if (text) {
        res.contentType("text/plain");
        res.send(text);
    } else {
        res.sendStatus(200);
    }
}

function shouldReturnFullPage(req: Request): boolean {
    return (req.headers[HTMX_REQUEST_HEADER] ? false : true) &&
        (req.headers[HTMX_RESTORE_HISTORY_REQUEST] ? false: true)
}

function returnNotFound(res: Response) {
    res.sendStatus(404);
}

function returnError(res: Response, error: AppError) {
    res.status(400)
    res.contentType("text/html");
    res.send(Pages.errorPage(error));
}

app.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
});
