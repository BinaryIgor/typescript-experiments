import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";
import * as FilesDb from "./files-db";
import * as Views from "./shared/views";
import { AppError, ErrorCode, Errors } from "./shared/errors";
import { AuthSessions, AuthUser } from "./auth/auth";
import * as Web from "./shared/web";
import { setCurrentUser, SessionCookies, currentUserName } from "./auth/web";
import * as AuthorsModule from "./authors/module";
import * as UserModule from "./user/module";
import * as QuotesModule from "./quotes/module";

const SERVER_PORT = 8080;

//5 hours;
const sessionDuration = 5 * 60 * 60 * 1000;
const sessionsDir = path.join("/tmp", "session");

if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir);
}

const authSessions = new AuthSessions(sessionsDir, sessionDuration, 60 * 1000);
const sessionCookies = new SessionCookies(sessionDuration, "session-id", false);

const dbPath = process.env.DB_PATH ?? path.join(__dirname, "..", "assets", "db");
const quoteNotesDbPath = path.join(dbPath, "__quote-notes.json");

const authorsModule = AuthorsModule.build(QuotesModule.quoteEndpoint);
const userModule = UserModule.build(authSessions, sessionCookies, authorsModule.returnHomePage);
const quotesModule = QuotesModule.build(quoteNotesDbPath,
    authorsModule.client.quoteOfId, userModule.client.usersOfIds);

staticFileContentOfPath(path.join(dbPath, "authors.json"))
    .then(db => FilesDb.importAuthors(db, authorsModule.client))
    .catch(e => console.log("Failed to load authors db!", e));

staticFileContentOfPath(path.join(dbPath, "users.json"))
    .then(db => FilesDb.importUsers(db, userModule.client))
    .catch(e => console.log("Failed to load users db!", e));

//TODO: minification/hashing + cache
const STATIC_ASSETS_PATH = process.env.STATIC_ASSETS_PATH ?? path.join(__dirname, "..", "assets");

const STYLES_PATH = function () {
    const stylesPath = process.env.STYLES_PATH;
    if (stylesPath) {
        console.log(`Styles path overriden, taking them from: ${stylesPath}`);
        return stylesPath;
    } else {
        return path.join(STATIC_ASSETS_PATH, "style.css");
    }
}();

console.log("Styles path:", STYLES_PATH);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

// Weak etags are added by default, we don't want that
app.set('etag', false);

app.use(Web.asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const session = sessionCookies.sessionFromCookie(req);
    let user: AuthUser | null;

    if (session) {
        user = await authSessions.authenticate(session);
    } else {
        user = null;
    }

    if (user) {
        setCurrentUser(req, user);
    }

    if (isPublicRequest(req) || user) {
        if (user && session && await authSessions.shouldRefresh(session)) {
            await authSessions.refresh(session);
            sessionCookies.setCookie(res, session);
        }
        next();
    } else {
        res.redirect(userModule.signInEndpoint);
    }
}));

function isPublicRequest(req: Request): boolean {
    return req.path.startsWith("/user") ||
        req.path.includes(".css") || req.path.includes(".js") || req.path.includes(".ico");
}

app.use(userModule.router);
app.use(authorsModule.router);
app.use(quotesModule.router);

app.get("/", authorsModule.returnHomePage);
app.get("/index.html", authorsModule.returnHomePage);

app.get("*", async (req: Request, res: Response) => {
    console.log("REq body...", req.body);
    if (req.url.includes("style")) {
        Web.returnCss(res, await staticFileContentOfPath(STYLES_PATH));
    } else if (req.url.includes(".js")) {
        const fileName = req.url.substring(req.url.lastIndexOf("/"));
        Web.returnJs(res, await staticFileContentOfPath(path.join(STATIC_ASSETS_PATH, fileName)));
    } else {
        Web.returnNotFound(res);
    }
})

function staticFileContent(filename: string): Promise<string> {
    return staticFileContentOfPath(path.join(__dirname, "static", filename));
}

function staticFileContentOfPath(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf-8');
}

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Something went wrong...", error);
    //TODO: refactor!
    let status: number;
    let errors: ErrorCode[]
    if (error instanceof AppError) {
        status = appErrorStatus(error);
        errors = error.errors;
    } else {
        status = 500;
        //TODO: maybe more details
        errors = ["UNKOWN_ERROR"];
    }
    res.status(status);
    Web.returnHtml(res, Views.errorPage(errors, Web.shouldReturnFullPage(req), currentUserName(req)));
});

function appErrorStatus(error: AppError): number {
    for (let e of error.errors) {
        if (e == Errors.NOT_AUTHENTICATED || e == Errors.INVALID_SESSION || e == Errors.EXPIRED_SESSION) {
            return 401;
        }
        if (e == Errors.INCORRECT_USER_PASSWORD) {
            return 403;
        }
        if (e.includes("NOT_FOUND")) {
            return 404;
        }
    }
    return 400;
}

app.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
});

//TODO: graceful shutdown
process.on('SIGTERM', () => {
    console.log("Received SIGTERM signal, exiting...")
    process.exit();
});

process.on('SIGINT', () => {
    console.log("Received SIGINT signal, exiting...")
    process.exit();
});