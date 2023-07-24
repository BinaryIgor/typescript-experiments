export class Authors {
    
    private readonly authors: Author[] = [];

    add(author: Author) {
        this.authors.push(author);
    }

    search(): Author[] {
        return this.authors;
    }
}

export class Author {
    constructor(readonly name: string) {}
}