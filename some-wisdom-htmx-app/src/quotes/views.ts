import { Translations } from "../shared/translations";
import * as Views from "../shared/views";

export const TRIGGERS = {
    getNotesSummary: "get-notes-summary"
};

export const LABELS = {
    quoteNoteForm: "quote-note-form"
};

//TODO: simplify params
export function quotePage(params: {
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

    const pageTranslations = Translations.defaultLocale.quotePage;

    const page = Views.wrappendInCenteredDiv(`<div class="py-16 px-8 w-full ${Views.PROPS.bgColorSecondary1} italic
        shadow-md rounded-b-xl ${Views.PROPS.shadowColorSecondary1}">
        <p class="text-2xl">"${params.quote}"</p>
        <p class="text-xl font-bold text-right ${Views.PROPS.txtColorSecondary1} mt-8">${params.author}</p>
    </div>
        <div class="p-4">
            <div class="flex justify-between">
                <p hx-get="${params.getQuotesNotesSummaryEndpoint}" hx-trigger="${TRIGGERS.getNotesSummary} from:body">
                    ${quoteNotesSummaryComponent(params.notes.length)}
                </p>
                <button id="${addNoteButtonId}">Add</button>
            </div>
            <form id="${addNoteFormId}" class="p-4 shadow-md relative ${Views.HIDDEN_CLASS}"
                hx-post="${params.addQuoteNoteEndpoint}"
                hx-target="#${notesListId}"
                ${Views.FORM_LABEL}="${LABELS.quoteNoteForm}"
                ${Views.CONFIRMABLE_ELEMENT_LABEL}="${pageTranslations.confirmAddQuoteNote}">
                ${Views.textAreaWithHiddenError('note', 'Your note...', params.validateQuoteNoteEndpoint)}
                <input id="${addNoteFormSubmitId}" class="absolute bottom-0 right-0 p-4 ${Views.DISABLED_CLASS}"
                    type="submit" value="Add"
                    ${Views.SUBMIT_FORM_LABEL}="${LABELS.quoteNoteForm}" disabled>
            </form>
            ${quoteNotesPage(params.notes, params.deletableNoteIds, params.deleteQuoteNoteEndpoint)}
            </div>
        </div>
    </div>
    ${Views.inlineJs(`
        const addNoteForm = document.getElementById("${addNoteFormId}");
        const addNoteSubmit = document.getElementById("${addNoteFormSubmitId}");

        document.getElementById("${addNoteButtonId}").onclick = () => {
            addNoteForm.classList.toggle("${Views.HIDDEN_CLASS}");
        };
    `)}
    `);

    return params.renderFullPage ? Views.wrappedInMainPage(page, params.currentUser) : page;
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
                   ${Views.CONFIRMABLE_ELEMENT_LABEL}="${confirmQuoteNoteDeleteMessage}">&times</span>`;
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

export class QuoteNoteView {
    constructor(
        readonly noteId: number,
        readonly quoteId: number,
        readonly note: string,
        readonly noteAuthor: string,
        readonly timestamp: string) { }
}