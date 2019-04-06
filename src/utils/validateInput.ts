/**
 * Validates input against an array or string of expected possibilities.
 * @param check What to check
 * @param shouldMatch The expected possibilities
 */
export function validateInput<T>(check: T, shouldMatch: T|T[]) {
    if (Array.isArray(shouldMatch)) {
        return shouldMatch.includes(check);
    } else {
        return check === shouldMatch;
    }
}
