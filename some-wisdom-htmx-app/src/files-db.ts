import { Author, Quote } from "./authors/domain";
import { User } from "./user/domain";
import fs from "fs";
import { UserClient } from "./user/module";
import { AuthorClient } from "./authors/module";
import { QuoteClient } from "./quotes/module";
import { NewQuoteNote } from "./quotes/domain";

class AuthorToImport {
    constructor(readonly name: string,
        readonly note: string,
        readonly quotes: string[]) { }
}

export function importAuthors(dbJson: string, client: AuthorClient) {
    const authorsFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${authorsFromDb.length} authors!`);

    let nextQuoteId = 1;

    for (let a of authorsFromDb) {
        const toImport = a as AuthorToImport;

        const quotes =  toImport.quotes.map(q => {
            const quote = new Quote(nextQuoteId, toImport.name, q);
            nextQuoteId++;
            return quote;
        });

        client.create(new Author(toImport.name, toImport.note, quotes));
    }
}

export function importUsers(dbJson: string, client: UserClient) {
    const usersFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${usersFromDb.length} users!`);

    for (let u of usersFromDb) {
        client.create(u as User);
    }
}

export function importQuoteNotes(dbJson: string, quoteClient: QuoteClient) {
    const quoteNotesFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${quoteNotesFromDb.length} quote notes of users!`);

    for (let qn of quoteNotesFromDb) {
        quoteClient.createQuoteNote(qn as NewQuoteNote);
    }
}

export function dumpQuoteNotes(dbPath: string, quoteClient: QuoteClient): Promise<void> {
    return fs.promises.writeFile(dbPath, JSON.stringify(quoteClient.allQuoteNotes()));
}