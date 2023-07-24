import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { Request, Response } from "express";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";

const SERVER_PORT = 8080;

const app = express();

app.use(bodyParser.urlencoded());

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url?.includes("style")) {
        returnCss(res, await staticFileContent("style.css"));
    } else {
        returnHomePage(res);
    }
})

app.post("/search-authors", (req: Request, res: Response) => {
    console.log("Searching fo authors...", req.body);
    returnHtml(res, `<div>Some html to swap</div`);
});

function staticFileContent(filename: string): Promise<string> {
    return fs.promises.readFile(path.join(__dirname, "static", filename), 'utf-8');
}

async function returnCss(res: Response, css: string) {
    res.contentType("text/css");
    res.send(css);
}

function returnHomePage(res: Response) {
    const authors = ["Friedrich Nietzsche", "Jordan Peterson", "Saifedean Ammous"];

    const authorsList = authors.map(a => `<li>${a}</li>`).join("\n");

    const homePage = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <title>Authors</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <h1 class="m-1">
            Some authors ought to be there...
        </h1>

        <div class="m-2">
            If in doubt, some sugestions:
            <ul class="m-2">
                ${authorsList}
            </ul>
        </div>
    
        <div class="w-full p-2">
            <input class="w-full p-1" name="authors-search" placeholder="Search for interesting authors..">
            <button class="w-full text-white bg-black p-1 mt-1 text-lg" 
                hx-post="/search-authors" hx-target="#search-results"
                hx-include="[name='authors-search']">Search</button>
            <div id="search-results">
            </div>
        </div>
      </body>

      <script src="${HTMX_SRC}"></script>
    </html>`;

    returnHtml(res, homePage);
}

function returnHtml(res: Response, html: string) {
    res.contentType("text/html");
    res.send(html);
}

app.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
});
