import { Author } from "./authors";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";
const ROOT_ID = "app";

export const AUTHORS_SEARCH_INPUT = "authors-search";

export function homePage(suggestedAuthors: string[], searchAuthorsEndpoint: string): string {
    const authorsList = suggestedAuthors.map(a => `<li class="ml-4">${a}</li>`).join("\n");
    return wrappedInMainPage(`<h1 class="m-1 text-xl">
                Some authors ought to be there...
            </h1>

            <div class="m-2">
                If in doubt, some sugestions:
                <ul class="m-2 list-disc">
                    ${authorsList}
                </ul>
            </div>
        
            <div class="w-full p-2">
                <input class="w-full p-1" name="${AUTHORS_SEARCH_INPUT}" 
                    placeholder="Search for interesting authors by their name or content from quotes..."
                    hx-trigger="keyup changed delay:500ms" 
                    hx-post="${searchAuthorsEndpoint}" 
                    hx-target="#search-results"
                    hx-indicator="#search-results-indicator">
                <!--button class="w-full text-white bg-black p-1 mt-1 text-lg" 
                    hx-post="${searchAuthorsEndpoint}" hx-target="#search-results"
                    hx-include="[name='${AUTHORS_SEARCH_INPUT}']">Search</button-->
                <div id="search-results-indicator" class="load-indicator">
                    Loading results...
                </div>
                <div id="search-results"></div>
            </div>
        </div>`);
}

function wrappedInMainPage(html: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <title>Authors</title>
        <link rel="stylesheet" href="/style.css"/>
      </head>
      <body>
        <div hx-history="true" id="${ROOT_ID}">
            ${html}
        </div>
      </body>

      <script src="${HTMX_SRC}"></script>
    </html>`;
}

export function authorsSearchResult(result: Author[], authorEndpoint: Function): string {
    const resultList = result.map(a =>
        `<div class="shadow-md p-4 cursor-pointer" hx-target="#${ROOT_ID}" hx-get="${authorEndpoint(a)}" hx-push-url="true">
            ${a.name}, ${a.quotes.length} quotes
        </div>`)
        .join('\n');
    return `<div class="space-y-4">${resultList}</div>`
}

export function authorPage(author: Author,  authorQuoteEndpoint: Function, renderFullPage: boolean): string {
    const quotes = author.quotes.map((q, idx) => `
        <div class="shadow-md p-4 cursor-pointer"
            hx-push-url="true" hx-target="#${ROOT_ID}" hx-get="${authorQuoteEndpoint(author, idx)}">
            "${q}"
        </div>`)
        .join('\n');

    const page = `<div class="m-2">
        <h1 class="text-xl">${author.name}</h1>
        <div class="p-2">${author.note}</div>
        <h1 class="text-lg">Quotes (${author.quotes.length})</h1>
        <div class="space-y-4">
            ${quotes}
        </div>
    </div>`;

    return renderFullPage ? wrappedInMainPage(page) : page;
}

export function authorQuotePage(author: string, quote: string, notes: string[], renedFullPage: boolean): string {
    const page = `<div class="shadow-md p-6">
        <p class="text-xl">"${quote}"</p>
        <p class="text-lg font-bold text-right">${author}</p>
    </div>
    <div>Notes (${notes.length})</div>
    `;
    
    return renedFullPage ? wrappedInMainPage(page) : page;
}