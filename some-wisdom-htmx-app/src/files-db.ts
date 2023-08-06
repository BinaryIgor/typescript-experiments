import { Author, Authors } from "./authors";
import { NewQuoteNote, QuoteNote, QuoteNotesRepository } from "./quote-notes";
import { Quote, Quotes } from "./quotes";
import { User, UserRepository } from "./user/domain";
import fs from "fs";
import { UserClient } from "./user/module";

class AuthorToImport {
    constructor(readonly name: string,
        readonly note: string,
        readonly quotes: string[]) { }
}

export function importAuthorsWithQuotes(dbJson: string, authors: Authors, quotes: Quotes) {
    const authorsFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${authorsFromDb.length} authors!`);

    let nextQuoteId = 1;

    for (let a of authorsFromDb) {
        const toImport = a as AuthorToImport;

        authors.add(new Author(toImport.name, toImport.note));

        toImport.quotes.forEach(q => {
            quotes.add(new Quote(nextQuoteId, toImport.name, q));
            nextQuoteId++;
        });
    }
}

export function importUsers(dbJson: string, client: UserClient) {
    const usersFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${usersFromDb.length} users!`);

    for (let u of usersFromDb) {
        client.create(u as User);
    }
}

export function importQuoteNotes(dbJson: string, quoteNotesRepository: QuoteNotesRepository) {
    const quoteNotesFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${quoteNotesFromDb.length} quote notes of users!`);

    for (let qn of quoteNotesFromDb) {
        quoteNotesRepository.create(qn as NewQuoteNote);
    }
}

export function dumpQuoteNotes(dbPath: string, quoteNotesRepository: QuoteNotesRepository): Promise<void> {
    return fs.promises.writeFile(dbPath, JSON.stringify(quoteNotesRepository.allNotes()));
}