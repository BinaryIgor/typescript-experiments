import { ErrorCode, OptionalErrorCode } from "./errors";
import { Translations } from "./translations";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";
export const ROOT_ID = "app";

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

export const PROPS = {
    bgColorPrimary: "bg-indigo-950",
    txtColorPrimary: "text-zinc-200",
    txtColorSecondary: "text-zinc-200",
    txtColorSecondary2: "text-zinc-400",
    bgColorSecondary1: "bg-indigo-900",
    bgColorSecondary2: "bg-indigo-800",
    txtColorBtn: "text-zinc-100",
    bgColorBtn: "bg-indigo-600",
    borderColorPrimary: "border-indigo-950",
    borderColorSecondary1: "border-indigo-900",
    borderColorSecondary2: "border-indigo-800",
    placeholderColor: "placeholder-zinc-500"
};

export function wrappedInMainPage(html: string, currentUser: string | null): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <title>${Translations.defaultLocale.appTitle}</title>
        <link rel="stylesheet" href="${STYLE_SRC}"/>
      </head>
      <body class="${PROPS.bgColorPrimary} ${PROPS.txtColorPrimary}">
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

export function inputWithHiddenError(props: {
    name: string,
    placeholder: string,
    validateEndpoint: string,
    type?: string,
    inputClasess?: string,
    errorClasses?: string
}): string {

    let inputClasess = `p-2 rounded-md ${PROPS.bgColorSecondary1} shadow-md mb-2 
        border-2 ${PROPS.borderColorSecondary2} 
        hover:${PROPS.bgColorSecondary2} focus:${PROPS.bgColorSecondary2} focus:outline-none
        ${PROPS.placeholderColor}`;

    if (props.inputClasess) {
        inputClasess += ` ${props.inputClasess}`
    }

    return `<input name="${props.name}" placeholder="${props.placeholder}" type="${props.type ?? 'text'}" 
        class="${inputClasess}"
        hx-trigger="keyup changed delay:500ms"
        hx-target="next .error-message"
        hx-swap="outerHTML"
        hx-post="${props.validateEndpoint}">
    ${inputErrorIf(null, props.errorClasses)}`
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
    const errorsTranslations = Translations.defaultLocale.errors as any;  
    return errorsTranslations[error] ?? error;
}

export function inputErrorIf(error: OptionalErrorCode = null, additionalClasses?: string): string {
    const translated = error ? translatedError(error) : "";
    let classes = `error-message ${translated ? 'active' : 'inactive'}`;
    if (additionalClasses) {
        classes += ` ${additionalClasses}`;
    }
    return `<p class="${classes}">${translated}</p>`
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
    let navigationClasses = `z-50 sticky flex justify-between top-0 w-full py-4 px-2 border-b-2  
        ${PROPS.borderColorSecondary2} ${PROPS.bgColorPrimary} ${PROPS.txtColorSecondary2}`;
    
    if (!currentUser) {
        navigationClasses += ` ${HIDDEN_CLASS}`;
    }

    //Id is used by index.js
    return `<div id="app-navigation" class="${navigationClasses}"
        hx-get="${GET_CURRENT_USER_ENDPOINT}"
        hx-trigger="${TRIGGERS.showNavigation} from:body"
        hx-swap="outerHTML">
        <div class="text-2xl">${Translations.defaultLocale.appTitle}</div>
        <div id="app-navigation-dropdown" class="cursor-pointer text-xl text-right relative w-fit" 
            hx-post="${SIGN_OUT_ENDPOINT}"
            hx-trigger="click"
            hx-replace-url="${SIGN_IN_ENDPOINT}"
            hx-swap="innerHTML"
            hx-target="#${ROOT_ID}">
                <div>${currentUser}</div>
                <ul class="${HIDDEN_CLASS} whitespace-nowrap absolute top-8 right-0 py-2 px-4 rounded-md shadow-md ${PROPS.bgColorSecondary2} ${PROPS.borderColorSecondary2}">
                    <li>
                        ${Translations.defaultLocale.navigation.profile}
                    </li>
                    <li>
                        ${Translations.defaultLocale.navigation.signOut}
                    </li>
                </ul>
            </div>
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