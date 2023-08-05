import { Author, Authors } from "./authors";
import { Quote, Quotes } from "./quotes";
import { User, UserRepository } from "./users";

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

export function importUsers(dbJson: string, userRepository: UserRepository) {
    const usersFromDb = JSON.parse(dbJson);

    console.log(`Db loaded, we have ${usersFromDb.length} users!`);

    for (let u of usersFromDb) {
        userRepository.create(u as User);
    }
}