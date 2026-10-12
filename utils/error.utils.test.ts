import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/utils/error.utils";

describe('getErrorMessage', () => {
    it('returns the message of an Error', () => {
        const error = new Error("error message");

        const message = getErrorMessage(error);

        expect(message).toBe("error message");
    });

    it('falls back for an Error with an empty message', () => {
        const error = new Error("");

        const message = getErrorMessage(error, "fallback error message");

        expect(message).toBe("fallback error message");
    });

    it('falls back for a thrown non-Error', () => {
        const error = "string";

        const message = getErrorMessage(error, "fallback error message");

        expect(message).toBe("fallback error message");
    });

    it('uses the default fallback when none is given', () => {
        const message = getErrorMessage(undefined);

        expect(message).toBe("Something went wrong");
    });
})
