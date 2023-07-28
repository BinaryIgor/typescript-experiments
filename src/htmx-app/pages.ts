import { Author } from "./authors";
import { Quote } from "./quotes";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";
const ROOT_ID = "app";

export const AUTHORS_SEARCH_INPUT = "authors-search";
const INDEX_JS_SRC = "/index.js";
const QUOTE_PAGE_JS_SRC = "/quote-page.js";

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
        ${errorModal()}
        <div hx-history="true" id="${ROOT_ID}" hx-history-elt>
            ${html}
        </div>
      </body>

      <script src="${HTMX_SRC}"></script>
      <script src="${INDEX_JS_SRC}"></script>
    </html>`;
}

export function authorsSearchResult(result: Author[], authorEndpoint: Function): string {
    const resultList = result.map(a =>
        `<div class="shadow-md p-4 cursor-pointer" hx-target="#${ROOT_ID}" hx-get="${authorEndpoint(a)}" hx-push-url="true">
            ${a.name}
        </div>`)
        .join('\n');
    return `<div class="space-y-4">${resultList}</div>`
}

export function authorPage(author: Author, authorQuotes: Quote[], quoteEndpoint: Function, renderFullPage: boolean): string {
    const quotes = authorQuotes.map(q => `
        <div class="shadow-md p-4 cursor-pointer"
            hx-push-url="true" hx-target="#${ROOT_ID}" hx-get="${quoteEndpoint(q.id)}">
            "${q.content}"
        </div>`)
        .join('\n');

    const page = `<div class="m-2">
        <h1 class="text-xl">${author.name}</h1>
        <div class="p-2">${author.note}</div>
        <h1 class="text-lg">Quotes (${authorQuotes.length})</h1>
        <div class="space-y-4">
            ${quotes}
        </div>
    </div>
    `;

    return renderFullPage ? wrappedInMainPage(page) : page;
}

export function authorQuotePage(params: {
    author: string, 
    quoteId: number,
    quote: string, 
    notes: string[],
    addQuoteNoteEndpoint: Function,
    renderFullPage: boolean
}): string {
    const page = `<div class="shadow-md p-6">
        <p class="text-2xl">"${params.quote}"</p>
        <p class="text-xl font-bold text-right">${params.author}</p>
    </div>
    <div class="p-4">
        <div class="flex justify-between">
            <p>Notes (${params.notes.length})</p>
            <button id="add-note-btn" onclick="toggleAddNoteForm()">Add</button>
        </div>
        <form id="add-note-form" class="hidden p-4 shadow-md relative"
            hx-post="${params.addQuoteNoteEndpoint(params.quoteId)}">
            <input name="note" placeholder="Your note..">
            <div></div>
            <input name="author" placeholder="Your name">
            <div></div>
            <input class="absolute bottom-0 right-0 p-4" type="submit" value="Add">
        </form>
    </div>
    ${inlineJs(`
        function toggleAddNoteForm() {
            document.getElementById("add-note-form").classList.toggle("hidden");
        };
    `)}
    `;

    return params.renderFullPage ? wrappedInMainPage(page) : page;
}

function pageJsSrc(src: string): string {
    return `<script src=${src}></script>`;
}

function inlineJs(js: string): string {
    return `<script>${js}</script>`
}

function errorModal(): string {
    return `<div class="modal hidden" id="error-modal">
        <div class="modal-content">
            <span id="error-modal-close" class="close">&times;</span>
            <div id="error-modal-content"></div>
        </div>
    </div>`;
}