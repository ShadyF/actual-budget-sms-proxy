export interface TransactionData {
    account: string
    date: string
    amount: number
    to_account?: string
    payee_name?: string
    type: "inflow" | "outflow"
    cleared: boolean
    currency?: string
    notes?: string
    fx_fee_percent?: number
    account_currency?: string
}

export interface TransactionParser {
    regex: string,
    account: string
    to_account?: string
    type: "inflow" | "outflow"
    append_year_prefix: boolean
    cleared: boolean
    fx_fee_percent?: number

    // This does not override the global MAIN_CURRENCY. It's only used to check if FX Fees apply or not.
    // Useful for accounts where the currency is NOT the MAIN_CURRENCY, but you don't want FX fees to apply when paying
    // using the account's native currency. (USD Account
    account_currency?: string
}


export const parseSMS = (senderName: string, body: string, config: Record<string, TransactionParser[]>): TransactionData => {
    if (!(senderName in config)) {
        // TODO: Replace this with a more meaningful type of error
        throw Error("Could not find SMS Sender in provided financial entities config.")
    }

    const senderTParsers = config[senderName]

    let transaction: TransactionData | null = null
    for (const parser of senderTParsers) {
        const matches = body.match(new RegExp(parser.regex, "i"))
        if (matches && matches.groups?.amount) {
            let date = ""

            if (matches.groups?.year && matches.groups?.day && matches.groups?.month) {
                date = `${parser.append_year_prefix ? "20" : ""}${matches.groups.year}-${matches.groups.month}-${matches.groups.day}`
            } else if (matches.groups?.date) {
                date = new Date(matches.groups?.date).toLocaleDateString('en-CA')
            } else {
                throw Error("Could not parse date. Make sure you define either a 'date' group or a 'year', 'month' and 'day' groups in your regular expression.")
            }

            transaction = {
                account: parser.account,
                date: date,
                amount: parseFloat(matches.groups?.amount.replace(/,/g, '')),
                to_account: parser.to_account,
                payee_name: matches.groups?.payee_name,
                type: parser.type,
                cleared: parser.cleared,
                currency: matches.groups?.currency,
                notes: matches.groups?.notes,
                fx_fee_percent: parser.fx_fee_percent,
                account_currency: parser.account_currency
            }
            break;
        }
    }
    if (!transaction) {
        throw Error("Couldn't find a matching regular expression for the provided sender.")
    }
    return transaction
}