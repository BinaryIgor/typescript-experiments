import { Author } from "./authors";
import { AppError, ErrorCode } from "./errors";
import { QuoteNote } from "./quote-notes";
import { Quote } from "./quotes";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";
const ROOT_ID = "app";


const ERRORS_TRANSLATIONS = {
    INVALID_QUOTE_NOTE_CONTENT: "Note can't be empty and needs to have 3 - 1000 characters",
    INVALID_QUOTE_NOTE_AUTHOR: "Note author can't be empty and needs to have 3 - 50 characters"
} as any;

export const AUTHORS_SEARCH_INPUT = "authors-search";
const INDEX_JS_SRC = "/index.js";

export const FORM_LABEL = "data-form";
export const SUBMIT_FORM_LABEL = "data-submit-form";

export const LABELS = {
    signInForm: "sign-in-form",
    quoteNoteForm: "quote-note-form"
};

const HIDDEN_CLASS = "hidden";
const DISABLED_CLASS = "disabled";

export const TRIGGERS = {
    getNotesSummary: "get-notes-summary"
};

//TODO: proper signIn page!
export function signInPage(signInEndpoint: string,
    validateNameEndpoint: string,
    validatePasswordEndpoint: string,
    renderFullPage: boolean): string {
    const page = `<form class="p-4 shadow-md relative"
        hx-post="${signInEndpoint}"
        hx-target="#${ROOT_ID}"
        hx-replace-url="/">
        ${inputWithHiddenError("name", "Your name...", validateNameEndpoint)}
        ${inputWithHiddenError("password", "Your password...", validatePasswordEndpoint, "password")}
        <input class="absolute bottom-0 right-0 p-4" type="submit" value="Sign In"
        ${SUBMIT_FORM_LABEL}="${LABELS.signInForm}">
    </form>`;
    return renderFullPage ? wrappedInMainPage(page) : page;
}

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
        <div hx-history="false" id="${ROOT_ID}" hx-history-elt>
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

//TODO: simplify params
export function authorQuotePage(params: {
    author: string,
    quote: string,
    notes: QuoteNoteView[],
    getQuotesNotesSummaryEndpoint: string,
    addQuoteNoteEndpoint: string,
    validateQuoteNoteEndpoint: string,
    validateQuoteAuthorEndpoint: string,
    renderFullPage: boolean
}): string {
    const addNoteButtonId = "add-note-button";
    const addNoteFormId = "add-note-form";
    const addNoteFormSubmitId = "add-note-form-submit";
    const notesListId = "notes-list";

    const page = `<div class="shadow-md p-6">
        <p class="text-2xl">"${params.quote}"</p>
        <p class="text-xl font-bold text-right">${params.author}</p>
    </div>
        <div class="p-4">
            <div class="flex justify-between">
                <p hx-get="${params.getQuotesNotesSummaryEndpoint}" hx-trigger="${TRIGGERS.getNotesSummary} from:body">
                    ${quoteNotesSummaryComponent(params.notes.length)}
                </p>
                <button id="${addNoteButtonId}">Add</button>
            </div>
            <form id="${addNoteFormId}" class="p-4 shadow-md relative ${HIDDEN_CLASS}"
                hx-post="${params.addQuoteNoteEndpoint}"
                hx-target="#${notesListId}"
                ${FORM_LABEL}="${LABELS.quoteNoteForm}">
                ${inputWithHiddenError('note', 'Your note...', params.validateQuoteNoteEndpoint)}
                <input id="${addNoteFormSubmitId}" class="absolute bottom-0 right-0 p-4" type="submit" value="Add"
                    ${SUBMIT_FORM_LABEL}="${LABELS.quoteNoteForm}">
            </form>
            ${quoteNotesPage(params.notes)}
            </div>
        </div>
    </div>
    ${inlineJs(`
        const addNoteForm = document.getElementById("${addNoteFormId}");
        const addNoteSubmit = document.getElementById("${addNoteFormSubmitId}");

        document.getElementById("${addNoteButtonId}").onclick = () => {
            addNoteForm.classList.toggle("${HIDDEN_CLASS}");
        };
    `)}
    `;

    return params.renderFullPage ? wrappedInMainPage(page) : page;
}

export function quoteNotesSummaryComponent(quoteNotes: number): string {
    return `Notes (${quoteNotes})`;
}

export function quoteNotesPage(quoteNotes: QuoteNoteView[]) {
    return `<div id="notes-list">
            ${quoteNotes.map(qn => `<div class="shadow-md p-4">
                <p class="text-xl">"${qn.note}"</p>
                <p class="text-right">Added by ${qn.noteAuthor}, at ${qn.timestamp}</p>
            </div>`).join('\n')}
        </div>`;
}

export function inputWithHiddenError(name: string, placeholder: string, validateEndpoint: string,
    type: string = "text"): string {
    return `<input name="${name}" placeholder="${placeholder}" type="${type}"
        hx-trigger="keyup changed delay:500ms"
        hx-target="next .error-message"
        hx-swap="outerHTML"
        hx-post="${validateEndpoint}">
    ${inputErrorIf()}`
}

export function errorsComponent(errors: ErrorCode[]): string {
    return errors.map(e => `<p>${translatedError(e)}</p>`).join('\n');
}

function translatedError(error: ErrorCode): string {
    return ERRORS_TRANSLATIONS[error] ?? error;
}

export function inputErrorIf(error: ErrorCode | null = null): string {
    const translated = error ? translatedError(error) : "";
    return `<p class="error-message ${translated ? 'active' : 'inactive'}">${translated}</p>`
}

function inlineJs(js: string, scoped: boolean = true): string {
    if (scoped) {
        js = `
            (function() {
                ${js}
            }());
        `;
    }
    // Wait for index.js
    return `<script type="module">${js}</script>`
}

function errorModal(): string {
    return `<div class="modal hidden" id="error-modal">
        <div class="modal-content">
            <span id="error-modal-close" class="close">&times;</span>
            <div id="error-modal-content"></div>
        </div>
    </div>`;
}

//TODO: style it!
export function errorPage(errors: ErrorCode[], renderFullPage: boolean): string {
    const page = `<div>
        <h1 class="m-1 text-xl">Something went wrong...</h1>
        ${errorsComponent(errors)}
    </div>`;
    return renderFullPage ? wrappedInMainPage(page) : page;
}

export class QuoteNoteView {
    constructor(readonly quoteId: number,
        readonly note: string,
        readonly noteAuthor: string,
        readonly timestamp: string) { }
}