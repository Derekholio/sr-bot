export function isValidUsername(username: string): boolean {
    // https://us.battle.net/support/en/article/26963
    const [playerName, btag] = [...username.split('#')];
    const doesNotStartWithNumberRegex = new RegExp(/^[A-Z]/i);
    const usernameValidationRegex = new RegExp(/^\w{3,12}$/);
    const btagIsNumbersRegex = new RegExp(/\d{4,5}/);

    return usernameValidationRegex.test(playerName)
    && doesNotStartWithNumberRegex.test(playerName)
    && btagIsNumbersRegex.test(btag);
}
