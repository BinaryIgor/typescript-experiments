import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { Author, Authors } from "./authors";
import * as Pages from "./pages";

const SERVER_PORT = 8080;

const SEARCH_AUTHORS_ENDPOINT = "/search-authors";

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

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url?.includes("style")) {
        returnCss(res, await staticFileContentOfPath(STYLES_PATH));
    } else {
        returnHomePage(res);
    }
})

app.post(SEARCH_AUTHORS_ENDPOINT, (req: Request, res: Response) => {
    console.log("Searching fo authors...", req.body);

    const query = req.body[Pages.AUTHORS_SEARCH_INPUT];

    const foundAuthors = authors.search(query);

    returnHtml(res, Pages.authorsSearchResult(foundAuthors));
});

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

app.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
});
