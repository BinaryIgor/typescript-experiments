import { Router, Request, Response } from "express";
import * as Web from "../shared/web";
import * as Views from "../shared/views";
import * as AuthorViews from "./views";
import { InMemoryAuthorRepository, InMemoryQuoteRepository } from "./repository";
import { Author, Quote } from "./domain";
import * as AuthWeb from "../auth/web";

const SEARCH_AUTHORS_ENDPOINT = "/search-authors";
const AUTHORS_ENDPOINT = "/authors";

export function build(quoteEndpoint: (quoteId: number) => string): AuthorModule {
    const quoteRepository = new InMemoryQuoteRepository();
    const authorRepository = new InMemoryAuthorRepository(quoteRepository);

    const router = Router();

    router.post(SEARCH_AUTHORS_ENDPOINT, (req: Request, res: Response) => {
        console.log("Searching fo authors...", req.body);

        const query = req.body[Views.AUTHORS_SEARCH_INPUT];

        const foundAuthors = authorRepository.search(query);
        //TODO: search quotes!

        //Slow it down, for demonstration purposes
        setTimeout(() => Web.returnHtml(res,
            AuthorViews.authorsSearchResult(foundAuthors, (a: Author) => `${AUTHORS_ENDPOINT}/${a.name}`)),
            1000);
    });

    router.get(`${AUTHORS_ENDPOINT}/:name`, (req: Request, res: Response) => {
        const name = req.params.name;
        console.log("Getting author:", name);

        const author = authorRepository.ofName(name);
        if (author) {
            Web.returnHtml(res, AuthorViews.authorPage(author, quoteEndpoint,
                Web.shouldReturnFullPage(req), AuthWeb.currentUserName(req)));
        } else {
            Web.returnNotFound(res);
        }
    });

    function returnHomePage(req: Request, res: Response) {
        const homePage = AuthorViews.homePage(authorRepository.random(3).map(a => a.name),
            SEARCH_AUTHORS_ENDPOINT,
            Web.shouldReturnFullPage(req),
            AuthWeb.currentUserName(req));

        Web.returnHtml(res, homePage);
    }

    return new AuthorModule(router, {
        create(author: Author) {
            authorRepository.create(author);
        },
        quoteOfId(id: number): Quote | null {
            return quoteRepository.ofId(id);
        },
    }, returnHomePage);
}

export class AuthorModule {
    constructor(readonly router: Router, readonly client: AuthorClient,
        readonly returnHomePage: (req: Request, res: Response) => void) { }
}

export interface AuthorClient {

    create(author: Author): void

    quoteOfId(id: number): Quote | null;
}