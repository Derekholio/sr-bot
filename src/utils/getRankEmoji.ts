/**
 * Returns an image which corresponds to the provider SR
 * @param sr Player SR
 */
export function getRankEmoji(sr: number) {
    if (between(sr, 0, 1499)) {
        return '<:ow_bronze:561738884409458701>';
    } else if (between(sr, 1500, 1999)) {
        return '<:ow_silver:561738499611688971>';
    } else if (between(sr, 2000, 2499)) {
        return '<:ow_gold:561738679220174878>';
    } else if (between(sr, 2500, 2999)) {
        return '<:ow_plat:561737404097101833>';
    } else if (between(sr, 3000, 3499)) {
        return '<:ow_diamond:561738187085578269>';
    } else if (between(sr, 3500, 3999)) {
        return '<:ow_masters:561739221711192065>';
    } else if (between(sr, 4000, 5000)) {
        return '<:ow_grand_masters:561751122952323083>';
    } else if (between(sr, 5001, Number.MAX_SAFE_INTEGER)) {
        return ':poop:';
    } else {
        return null;
    }
}

function between(number: number, min: number, max: number) {
    return number >= min && number <= max;
}
