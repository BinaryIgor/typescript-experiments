export interface AuthorRepository {

    create(author: Author): void

    search(query: string): Author[]

    ofName(name: string): Author | null

    random(size: number): Author[]
}

export interface QuoteRepository {
    ofId(id: number): Quote | null
}

export class Author {
    constructor(readonly name: string,
        readonly note: string,
        readonly quotes: Quote[]) { }
}

export class Quote {
    constructor(readonly id: number, readonly author: string, readonly content: string) { }
}