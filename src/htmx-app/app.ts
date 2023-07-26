import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import {Author, Authors } from "./authors";
import * as Pages from "./pages";

const SERVER_PORT = 8080;

const HTMX_REQUEST_HEADER = "hx-request";

const SEARCH_AUTHORS_ENDPOINT = "/search-authors";
const AUTHORS_ENDPOINT = "/authors";
const QUOTES_ENDPOINT_PART = "quotes";

const authors = new Authors();

staticFileContent("db.json")
    .then(db => {
        const authorsFromDb = JSON.parse(db);
        console.log(`Db loaded, we have ${authorsFromDb.length} authors!`);
        for (let a of authorsFromDb) {
            authors.add(a);
        }
    })
    .catch(e => console.log("Failed to load authors db!", e));

const STYLES_PATH = function () {
    const stylesPath = process.env.STYLES_PATH;
    if (stylesPath) {
        console.log(`Styles path overriden, taking them from: ${stylesPath}`);
        return stylesPath;
    } else {
        return path.join(__dirname, "static", "style.css");
    }
}();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.post(SEARCH_AUTHORS_ENDPOINT, (req: Request, res: Response) => {
    console.log("Searching fo authors...", req.body);

    const query = req.body[Pages.AUTHORS_SEARCH_INPUT];

    const foundAuthors = authors.search(query);

    returnHtml(res, Pages.authorsSearchResult(foundAuthors, (a: Author) => `${AUTHORS_ENDPOINT}/${a.name}`));
});

app.get(`${AUTHORS_ENDPOINT}/:name`, (req: Request, res: Response) => {
    const name = req.params.name;
    console.log("Getting author:", name);

    const author = authors.findByName(name);
    if (author) {
        returnHtml(res, Pages.authorPage(author,
             (a: Author, qIdx: number) => `${AUTHORS_ENDPOINT}/${a.name}/${QUOTES_ENDPOINT_PART}/${qIdx}`,
             shouldReturnFullPage(req)));
    } else {
        returnNotFound(res);
    }
});

app.get(`${AUTHORS_ENDPOINT}/:name/${QUOTES_ENDPOINT_PART}/:id`, (req: Request, res: Response) => {
    const name = req.params.name;
    //TODO refactor!
    const quoteId = req.params.id as any as number;
    console.log(`Getting ${quoteId} quote of ${name} author`);

    const quote = authors.findQuoteOfAuthor(name, quoteId);
    if (quote) {
        returnHtml(res, Pages.authorQuotePage(name, quote, [], shouldReturnFullPage(req)));
    } else {
        returnNotFound(res);
    }
});

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url?.includes("style")) {
        returnCss(res, await staticFileContentOfPath(STYLES_PATH));
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

function returnHomePage(res: Response) {
    returnHtml(res, Pages.homePage(authors.random(3).map(a => a.name), SEARCH_AUTHORS_ENDPOINT));
}

function returnHtml(res: Response, html: string) {
    res.contentType("text/html");
    res.send(html);
}

function shouldReturnFullPage(req: Request): boolean {
    return req.headers[HTMX_REQUEST_HEADER]?.includes("true") ? false : true;
}

function returnNotFound(res: Response) {
    res.sendStatus(404);
}

app.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
});
