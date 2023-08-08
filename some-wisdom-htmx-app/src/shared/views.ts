import { ErrorCode, OptionalErrorCode } from "./errors";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";
export const ROOT_ID = "app";

const ERRORS_TRANSLATIONS = {
    INVALID_QUOTE_NOTE_CONTENT: "Note can't be empty and needs to have 3 - 1000 characters",
    INVALID_QUOTE_NOTE_AUTHOR: "Note author can't be empty and needs to have 3 - 50 characters"
} as any;

export const AUTHORS_SEARCH_INPUT = "authors-search";
const STYLE_SRC = "/style.css";
const INDEX_JS_SRC = "/index.js";

export const FORM_LABEL = "data-form";
export const CONFIRMABLE_ELEMENT_LABEL = "data-confirmable-element";
export const SUBMIT_FORM_LABEL = "data-submit-form";

export const HIDDEN_CLASS = "hidden";
export const DISABLED_CLASS = "disabled";

export const TRIGGERS = {
    showNavigation: "show-navigation",
    hideNavigation: "hide-navigation"
};

const GET_CURRENT_USER_ENDPOINT = "/user";
const SIGN_IN_ENDPOINT = "/user/sign-in";
const SIGN_OUT_ENDPOINT = "/user/sign-out";

export function wrappedInMainPage(html: string, currentUser: string | null): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <title>Some wisdom</title>
        <link rel="stylesheet" href="${STYLE_SRC}"/>
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

export function inputErrorIf(error: OptionalErrorCode = null): string {
    const translated = error ? translatedError(error) : "";
    return `<p class="error-message ${translated ? 'active' : 'inactive'}">${translated}</p>`
}

export function inlineJs(js: string, scoped: boolean = true): string {
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

export function errorModal(): string {
    return `<div class="modal ${HIDDEN_CLASS}" id="error-modal">
        <div class="modal-content">
            <span id="error-modal-close" class="close">&times;</span>
            <div id="error-modal-content"></div>
        </div>
    </div>`;
}

export function navigationComponent(currentUser: string | null): string {
    const hiddenClass = currentUser ? "" : ` ${HIDDEN_CLASS}`;
    return `<div class="z-50 sticky flex justify-between top-0 w-full p-4 border-b-2 border-black bg-white${hiddenClass}"
        hx-get="${GET_CURRENT_USER_ENDPOINT}"
        hx-trigger="${TRIGGERS.showNavigation} from:body"
        hx-swap="outerHTML">
        <div>Some naive navigation for a reader: ${currentUser}</div>
        <div class="cursor-pointer" 
            hx-post="${SIGN_IN_ENDPOINT}"
            hx-trigger="click"
            hx-replace-url="${SIGN_OUT_ENDPOINT}"
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

export function formValidatedTrigger(formLabel: string, valid: boolean) {
    return JSON.stringify({
        "form-validated": {
            "label": formLabel,
            "valid": valid
        }
    });
}

export function resetFormTrigger(label: string, additionalTriggers: any): string {
    return JSON.stringify({
        "reset-form": label,
        ...additionalTriggers
    });
}

export function additionalTrigersOfKeys(...keys: string[]): any {
    const jsonBody = [...keys].map(k => `"${k}": true`).join(",\n");
    return JSON.parse(`{ ${jsonBody} }`);
}