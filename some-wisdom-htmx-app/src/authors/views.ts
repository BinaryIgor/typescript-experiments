import { Translations } from "../shared/translations";
import * as Views from "../shared/views";
import { Author } from "./domain";

export const AUTHORS_SEARCH_INPUT = "authors-search";

export function homePage(suggestedAuthors: string[], searchAuthorsEndpoint: string,
    renderFullPage: boolean,
    currentUser: string | null): string {
    const homePageTranslations = Translations.defaultLocale.homePage;

    const authorsList = suggestedAuthors.map(a => `<li class="ml-4">${a}</li>`).join("\n");
    
    const searchResultsId = "search-results";

    const page = `<h1 class="m-2 text-xl">${homePageTranslations.header}</h1>

    <div class="m-4">
        ${homePageTranslations.suggestion}
        <ul class="m-2 list-disc">
            ${authorsList}
        </ul>
    </div>

    <div class="w-full p-2">
        <input class="${Views.INPUT_LIKE_CLASSES} w-full" name="${AUTHORS_SEARCH_INPUT}" 
            placeholder="${homePageTranslations.searchPlaceholder}"
            hx-trigger="keyup changed delay:500ms" 
            hx-post="${searchAuthorsEndpoint}" 
            hx-target="#${searchResultsId}"
            hx-indicator="#search-results-indicator">
        <div id="search-results-indicator" class="load-indicator rounded-md text-xl shadow-md">
            ${homePageTranslations.searchLoader}
        </div>
        <div class="mt-2" id="${searchResultsId}"></div>
    </div>
    </div>`
    return renderFullPage ? Views.wrappedInMainPage(page, currentUser) : page;
}

export function authorsSearchResult(result: Author[], authorEndpoint: Function): string {
    const resultList = result.map(a =>
        `<div class="rounded-lg shadow py-2 px-4 cursor-pointer border-2 text-xl 
            ${Views.PROPS.borderColorSecondary2} ${Views.PROPS.shadowColorSecondary2}"
        hx-target="#${Views.ROOT_ID}" hx-get="${authorEndpoint(a)}" hx-push-url="true">
            ${a.name}
        </div>`)
        .join('\n');

    let results;
    if (resultList) {
        results = resultList;
    } else {
        results = `<div class="px-4">${Translations.defaultLocale.homePage.noAuthors}</div>`;
    }

    return `<div class="space-y-2">${results}</div>`
}

export function authorPage(author: Author, quoteEndpoint: (quoteId: number) => string,
    renderFullPage: boolean, currentUser: string | null): string {
    const quotes = author.quotes.map(q => `
        <div class="shadow-md p-4 cursor-pointer"
            hx-push-url="true" hx-target="#${Views.ROOT_ID}" hx-get="${quoteEndpoint(q.id)}">
            "${q.content}"
        </div>`)
        .join('\n');

    const page = `<div class="m-2">
        <h1 class="text-xl">${author.name}</h1>
        <div class="p-2">${author.note}</div>
        <h1 class="text-lg">Quotes (${author.quotes.length})</h1>
        <div class="space-y-4">
            ${quotes}
        </div>
    </div>
    `;

    return renderFullPage ? Views.wrappedInMainPage(page, currentUser) : page;
}