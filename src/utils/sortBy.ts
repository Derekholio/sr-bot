/**
 * Sorts an object array from highest to lowest.
 * @param {*[]} sort Array to sort
 * @param {keyof *} by What to sort by.  This should be a key of the object in the array
 * @param {boolean} invert Optional. Sort from low to high.
 */
export function sortBy<T>(sort: T[], by: keyof T, invert?: boolean) {
    return sort.sort((a: T, b: T) => {
        if (invert) {
            return (a[by] < b[by]) ? -1 : 1;
        }
        return (a[by] < b[by]) ? 1 : -1;
    });
}

