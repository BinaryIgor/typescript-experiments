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
export const CONFIRMABLE_ELEMENT_LABEL = "data-confirmable-element";
export const SUBMIT_FORM_LABEL = "data-submit-form";

export const LABELS = {
    signInForm: "sign-in-form",
    quoteNoteForm: "quote-note-form"
};

const HIDDEN_CLASS = "hidden";
const DISABLED_CLASS = "disabled";

export const TRIGGERS = {
    getNotesSummary: "get-notes-summary",
    showNavigation: "show-navigation",
    hideNavigation: "hide-navigation"
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
        <input class="absolute bottom-0 right-0 p-4 ${DISABLED_CLASS}" type="submit" value="Sign In"
        ${SUBMIT_FORM_LABEL}="${LABELS.signInForm}" disabled>
    </form>`;
    return renderFullPage ? wrappedInMainPage(page, null) : page;
}

export function homePage(suggestedAuthors: string[], searchAuthorsEndpoint: string,
    renderFullPage: boolean,
    currentUser: string | null): string {
    const authorsList = suggestedAuthors.map(a => `<li class="ml-4">${a}</li>`).join("\n");
    const page = `<h1 class="m-1 text-xl">
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
    </div>`
    return renderFullPage ? wrappedInMainPage(page, currentUser) : page;
}

function wrappedInMainPage(html: string, currentUser: string | null): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <title>Authors</title>
        <link rel="stylesheet" href="/style.css"/>
      </head>
      <body>
        ${navigationComponent(currentUser)}
        ${confirmableModal()}
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

export function authorPage(author: Author, authorQuotes: Quote[], quoteEndpoint: Function,
    renderFullPage: boolean,
    currentUser: string | null): string {
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

    return renderFullPage ? wrappedInMainPage(page, currentUser) : page;
}

//TODO: simplify params
export function authorQuotePage(params: {
    author: string,
    quote: string,
    notes: QuoteNoteView[],
    deletableNoteIds: number[],
    deleteQuoteNoteEndpoint: (quoteId: number) => string,
    getQuotesNotesSummaryEndpoint: string,
    addQuoteNoteEndpoint: string,
    validateQuoteNoteEndpoint: string,
    validateQuoteAuthorEndpoint: string,
    renderFullPage: boolean,
    currentUser: string | null
}): string {
    const addNoteButtonId = "add-note-button";
    const addNoteFormId = "add-note-form";
    const addNoteFormSubmitId = "add-note-form-submit";
    const notesListId = "notes-list";

    const confirmQuoteNoteMessage = "Are you sure that you want to add this note?";

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
                ${FORM_LABEL}="${LABELS.quoteNoteForm}"
                ${CONFIRMABLE_ELEMENT_LABEL}="${confirmQuoteNoteMessage}">
                ${textAreaWithHiddenError('note', 'Your note...', params.validateQuoteNoteEndpoint)}
                <input id="${addNoteFormSubmitId}" class="absolute bottom-0 right-0 p-4 ${DISABLED_CLASS}"
                    type="submit" value="Add"
                    ${SUBMIT_FORM_LABEL}="${LABELS.quoteNoteForm}" disabled>
            </form>
            ${quoteNotesPage(params.notes, params.deletableNoteIds, params.deleteQuoteNoteEndpoint)}
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

    return params.renderFullPage ? wrappedInMainPage(page, params.currentUser) : page;
}

export function quoteNotesSummaryComponent(quoteNotes: number): string {
    return `Notes (${quoteNotes})`;
}

export function quoteNotesPage(quoteNotes: QuoteNoteView[],
    deleteableQuoteNoteIds: number[],
    deleteQuoteNoteEndpoint: (noteId: number) => string) {

    const confirmQuoteNoteDeleteMessage = "Are you sure you want to delete this note?";
        
    return `<div id="notes-list">
            ${quoteNotes.map(qn => {
                const noteElementId = `notes-list-element-${qn.noteId}`;
                let deleteEl: string;
                if(deleteableQuoteNoteIds.includes(qn.noteId)) {
                   deleteEl = `<span class="text-3xl absolute top-0 right-0 p-2 cursor-pointer"
                   hx-swap="delete"
                   hx-target="#${noteElementId}"
                   hx-delete="${deleteQuoteNoteEndpoint(qn.noteId)}"
                   ${CONFIRMABLE_ELEMENT_LABEL}="${confirmQuoteNoteDeleteMessage}">&times</span>`;
                } else {
                    deleteEl = "";
                }
                return `<div id="${noteElementId}" class="shadow-md p-4 relative">
                    <p class="text-xl whitespace-pre">"${qn.note}"</p>
                    <p class="text-right">Added by ${qn.noteAuthor}, on ${qn.timestamp}</p>
                    ${deleteEl}
                </div>`})
            .join('\n')}
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

export function textAreaWithHiddenError(name: string, placeholder: string, validateEndpoint: string): string {
    return `<textarea name="${name}" placeholder="${placeholder}" 
        class="h-24 w-9/12 resize-none"
        hx-trigger="keyup changed delay:500ms"
        hx-target="next .error-message"
        hx-swap="outerHTML"
        hx-post="${validateEndpoint}"></textarea>
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
    return `<div class="modal ${HIDDEN_CLASS}" id="error-modal">
        <div class="modal-content">
            <span id="error-modal-close" class="close">&times;</span>
            <div id="error-modal-content"></div>
        </div>
    </div>`;
}

//TODO: restructure the code!
export function navigationComponent(currentUser: string | null): string {
    const hiddenClass = currentUser ? "" : ` ${HIDDEN_CLASS}`;
    return `<div id="app-navigation" class="z-50 sticky flex justify-between top-0 w-full p-4 border-b-2 border-black bg-white${hiddenClass}"
        hx-get="/current-user"
        hx-trigger="${TRIGGERS.showNavigation} from:body"
        hx-swap="outerHTML">
        <div>Some naive navigation for a reader: ${currentUser}</div>
        <div class="cursor-pointer" 
            hx-post="/sign-out"
            hx-trigger="click"
            hx-replace-url="/sign-in"
            hx-swap="innerHTML"
            hx-target="#${ROOT_ID}">Say Cya!</div>
    </div>`;
}

function confirmableModal(): string {
    return `<div class="modal ${HIDDEN_CLASS}" id="confirmable-modal">
        <div class="modal-content relative">
            <span id="confirmable-modal-close" class="close">&times;</span>
            <div class="p-4 mb-4" id="confirmable-modal-content"></div>
            <span id="confirmable-modal-cancel" class="absolute bottom-0 left-0 p-4 cursor-pointer">Cancel</span>
            <span id="confirmable-modal-ok" class="absolute bottom-0 right-0 p-4 cursor-pointer">Ok</span>
        </div>
    </div>`;
}

//TODO: style it!
export function errorPage(errors: ErrorCode[], renderFullPage: boolean, currentUser: string | null): string {
    const page = `<div>
        <h1 class="m-1 text-xl">Something went wrong...</h1>
        ${errorsComponent(errors)}
    </div>`;
    return renderFullPage ? wrappedInMainPage(page, currentUser) : page;
}

export class QuoteNoteView {
    constructor(
        readonly noteId: number,
        readonly quoteId: number,
        readonly note: string,
        readonly noteAuthor: string,
        readonly timestamp: string) { }
}