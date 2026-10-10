import { ErrorResponse } from "./error-response";

export class RegisterError extends ErrorResponse {
    email?: string
    displayName?: string;
    username?: string;
    password?: string;
    dateOfBirth?: string;

    constructor(obj: Partial<RegisterError>) {
        super();
        Object.assign(this, obj);
    }
}