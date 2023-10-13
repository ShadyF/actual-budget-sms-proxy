import {financialEntities} from "./config";

export interface TransactionData {
    account: string
    date: string
    amount: number
    payee_name: string
    type: "inflow" | "outflow"
    cleared: boolean
    currency?: string
    notes?: string
}

export interface Parser {
    account: string
    regex: RegExp,
    type: "inflow" | "outflow"
    appendYearPrefix: boolean
    cleared: boolean
}


export const parseSMS = (smsSender: string, sms: string): TransactionData => {
    const parsers = financialEntities[smsSender]

    let transaction: TransactionData | null = null
    for (const parser of parsers) {
        const matches = sms.match(parser.regex)
        if (matches && matches.groups?.year && matches.groups?.day && matches.groups?.month && matches.groups?.amount) {
            const date = `${parser.appendYearPrefix ? "20" : ""}${matches.groups.year}-${matches.groups.month}-${matches.groups.day}`
            transaction = {
                account: parser.account,
                date: date,
                amount: parseFloat(matches.groups?.amount),
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