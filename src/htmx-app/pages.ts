import { Author } from "./authors";

const HTMX_SRC = "https://unpkg.com/htmx.org@1.9.3";

export const AUTHORS_SEARCH_INPUT = "authors-search";

export function homePage(suggestedAuthors: string[], searchAuthorsEndpoint: string): string {
    const authorsList = suggestedAuthors.map(a => `<li class="ml-4">${a}</li>`).join("\n");
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
        <title>Authors</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <h1 class="m-1 text-xl">
            Some authors ought to be there...
        </h1>

        <div class="m-2">
            If in doubt, some sugestions:
            <ul class="m-2 list-disc">
                ${authorsList}
            </ul>
        </div>
    
        <div class="w-full p-2">
            <input class="w-full p-1" name="${AUTHORS_SEARCH_INPUT}" placeholder="Search for interesting authors by their name or content from quotes...">
            <button class="w-full text-white bg-black p-1 mt-1 text-lg" 
                hx-post="${searchAuthorsEndpoint}" hx-target="#search-results"
                hx-include="[name='${AUTHORS_SEARCH_INPUT}']">Search</button>
            <div id="search-results">
            </div>
        </div>
      </body>

      <script src="${HTMX_SRC}"></script>
    </html>`;
}

export function authorsSearchResult(result: Author[]): string {
    const resultList = result.map(a => `<div class="m-4">${a.name}, ${a.quotes.length} quotes</div>`).join('\n');
    return `<div class=flex">${resultList}</div>`
}