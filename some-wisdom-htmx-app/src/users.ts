import { AuthUser } from "./auth";
import { AppError, ErrorCode, Errors } from "./errors";
import * as Validator from "./validator";

const MIN_USER_NAME_LENGTH = 2;
const MAX_USER_NAME_LENGTH = 30;
const MIN_USER_PASSWORD_LENGTH = 8;
const MAX_USER_PASSWORD_LENGTH = 50;

export class UserSignInInput {
    constructor(readonly name: string, readonly password: string) { }
}

export class UserService {

    constructor(private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher) {}

    signIn(name: string, password: string): AuthUser {
        const nameError = this.validateUserName(name);
        const passwordError = this.validateUserPassword(password);

        AppError.throwIfThereAreErrors(nameError, passwordError);

        const user = this.userRepository.ofName(name);
        if (!user) {
            throw AppError.ofSingleError(Errors.USER_DOES_NOT_EXIST);
        }
        
        if (!this.passwordHasher.verify(password, user.password)) {
            throw AppError.ofSingleError(Errors.INCORRECT_USER_PASSWORD);
        }

        return new AuthUser(user.id, user.name);
    }

    validateUserName(name: string): ErrorCode | null {
        return Validator.hasAnyContent(name) 
            && Validator.hasLength(name, MIN_USER_NAME_LENGTH, MAX_USER_NAME_LENGTH) ?
            null : Errors.INVALID_USER_NAME;
    }

    validateUserPassword(password: string): ErrorCode | null {
        return Validator.hasAnyContent(password) 
            && Validator.hasLength(password, MIN_USER_PASSWORD_LENGTH, MAX_USER_PASSWORD_LENGTH) ?
            null : Errors.INVALID_USER_PASSWORD;
    }

    usersOfIds(ids: number[]): Map<number, User> {
        return this.userRepository.ofIds(ids);
    }
}


export class User {
    constructor(readonly id: number,
        readonly name: string,
        readonly password: string) { }
}

export interface UserRepository {
    
    ofId(id: number): User | null;

    ofIds(ids: number[]): Map<number, User>

    ofName(name: string): User | null;
    
    create(user: User): void;
}

export class InMemoryUserRepository implements UserRepository {

    private readonly db = new Map<number, User>();

    ofId(id: number): User | null {
        return this.db.get(id) ?? null;
    }

    ofIds(ids: number[]): Map<number, User> {
        const found = new Map<number, User>();
        ids.forEach(id => {
            const user = this.ofId(id);
            if (user) {
                found.set(id, user);
            }
        });
        return found;
    }

    ofName(name: string): User | null {
        for (let u of this.db.values()) {
            if (u.name == name) {
                return u;
            }
        }
        return null;
    }

    create(user: User): void {
        this.db.set(user.id, user);
    }    
}

export interface PasswordHasher {
    verify(rawPassword: string, hashedPassword: string): boolean
}

export class Base64PasswordHasher implements PasswordHasher {
    verify(rawPassword: string, hashedPassword: string): boolean {
        return Buffer.from(rawPassword, 'utf8').toString('base64') == hashedPassword;
    }
}

