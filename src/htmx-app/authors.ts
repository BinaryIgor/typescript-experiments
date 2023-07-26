export class Authors {

    private readonly authors: Author[] = [];

    add(author: Author) {
        this.authors.push(author);
    }

    search(query: string): Author[] {
        const loweredQuery = query.toLowerCase();
        return this.authors.filter(a => a.name.toLowerCase().includes(loweredQuery));
    }

    findByName(name: string): Author | null {
        for(let a of this.authors) {
            if (a.name == name) {
                return a;
            }
        }
        return null;
    }

    random(size: number): Author[] {
        if (size >= this.authors.length) {
            return this.authors;
        }

        const maxStartIdx = this.authors.length - size;
        const startIdx = randomNumber(maxStartIdx);

        return this.authors.slice(startIdx, size);
    }
}

function randomNumber(max: number): number {
    return Math.floor(Math.random() * max);
}

export class Author {
    constructor(readonly name: string,
        readonly note: string,
        readonly quotes: string[]) { }
}