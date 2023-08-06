export class Quotes {

    private readonly quotes: Quote[] = [];

    add(quote: Quote) {
        this.quotes.push(quote);
    }

    search(query: string): Quote[] {
        const loweredQuery = query.toLowerCase();
        return this.quotes.filter(q => q.content.toLowerCase().includes(loweredQuery));
    }

    ofAuthor(name: string): Quote[] {
        return this.quotes.filter(q => q.author == name);
    }

    ofId(id: number): Quote | null {
        for (let q of this.quotes) {
            if (q.id == id) {
                return q;
            }
        }
        return null;
    }
}

export class Quote {
    constructor(readonly id: number, readonly author: string, readonly content: string) { }
}