import http from "http";
import fs from "fs";
import path from "path";

const server = http.createServer();

server.on("request", async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url?.includes("style")) {
        returnCss(res, await staticFileContent("style.css"));
    } else {
        returnHomePage(res);
    }
});

function staticFileContent(filename: string): Promise<string> {
    return fs.promises.readFile(path.join(__dirname, "static", filename), 'utf-8');
}

async function returnCss(res: http.ServerResponse, css: string) {
    res.setHeader("content-type", "text/css");
    res.end(css);
}

function returnHomePage(res: http.ServerResponse) {
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
        <h1 class="m-8">
            Some authors ought to be there...
        </h1>

        <div class="m-16">
            If in doubt, some sugestions:
            <ul class="m-16">
                ${authorsList}
            </ul>
        </div>
    
        <input id="authors-search">Search for interesting authors...</input>
    
      </body>
    </html>`;

    returnHtml(res, homePage);
}

function returnHtml(res: http.ServerResponse, html: string) {
    res.setHeader("content-type", "text/html");
    // res.setHeader("")
    res.end(html);
}

server.listen(8080);