// `catch` gives `unknown`: mutation hooks throw `Error`s, but anything can be thrown.
export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
    return error instanceof Error && error.message ? error.message : fallback;
}
