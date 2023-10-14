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
}

export interface TransactionParser {
    regex: string,
    account: string
    to_account?: string
    type: "inflow" | "outflow"
    append_year_prefix: boolean
    cleared: boolean
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
        if (matches && matches.groups?.year && matches.groups?.day && matches.groups?.month && matches.groups?.amount) {
            const date = `${parser.append_year_prefix ? "20" : ""}${matches.groups.year}-${matches.groups.month}-${matches.groups.day}`
            transaction = {
                account: parser.account,
                date: date,
                amount: parseFloat(matches.groups?.amount),
                to_account: parser.to_account,
                payee_name: matches.groups?.payee_name,
                type: parser.type,
                cleared: parser.cleared,
                currency: matches.groups?.currency,
                notes: matches.groups?.notes,
            }
            break;
        }
    }
    if (!transaction) {
        throw Error("Couldn't find a matching regular expression for the provided sender.")
    }
    return transaction
}