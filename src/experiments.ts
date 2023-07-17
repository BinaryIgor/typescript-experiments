import * as Records from "./records.js";
import crypto from 'crypto';

type UUID = string;

class User {
    constructor(readonly id: UUID,
        readonly name: string,
        readonly email: string,
        readonly createdAt: number,
        readonly roles: UserRole[]) {
    }
}

class UserRole {
    constructor(readonly name: string, readonly description: string) {
    }
}

const user = new User(crypto.randomUUID(), "Igor", "igor@gmail.com", Date.now(), 
    [new UserRole("Admin", "some admin")]);

console.log("Source user: ", user);
console.log("Changed user 1:", Records.copy(user, { createdAt: Date.now() - 1000}));
console.log("Changed user 2:", Records.copy(user, { roles: []}));