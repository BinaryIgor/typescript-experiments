import * as Records from "./records.js";
import crypto from 'crypto';

type UUID = string;
type Timestamp = number;

class User {
    constructor(
        readonly id: UUID,
        readonly name: string,
        readonly email: string,
        readonly createdAt: Timestamp,
        readonly roles: UserRole[]) { }

    firstRole(): UserRole | null {
        return this.roles ? this.roles[0] : null;
    }
}

class UserRole {
    constructor(readonly name: string, readonly description: string) { }
}

const user = new User(crypto.randomUUID(), "Igor", "igor@gmail.com", Date.now(),
    [new UserRole("Admin", "some admin")]);

const changedUser1 = Records.copy(user, { createdAt: Date.now() + 1000, email: "gmail@igor.com" });
const changedUser2 = Records.copy(user, { roles: [] });

console.log("Source user: ", user);
console.log("Changed user 1:", changedUser1);
console.log("Changed user 2:", changedUser2);
console.log("Type of source user:", user.constructor);
console.log("Type of user 1:", changedUser1.constructor);
console.log("First role of user 1:", changedUser1.firstRole());