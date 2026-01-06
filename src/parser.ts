import {TransactionData, SMSParserRule} from "./types";

export const parseSMS = (senderName: string, body: string, config: Record<string, SMSParserRule[]>): TransactionData => {
    if (!(senderName in config)) {
        // TODO: Replace this with a more meaningful type of error
        throw Error("Could not find SMS Sender in provided financial entities config.")
    }

    const senderParserRules = config[senderName]

    let transaction: TransactionData | null = null
    for (const rule of senderParserRules) {
        const matches = body.match(new RegExp(rule.regex, "i"))
        if (matches && matches.groups?.amount) {
            let date = ""

            // Check if auto_add_date flag is set. No need to match date from SMS body then.
            if (rule.auto_add_date) {
                date = new Date().toLocaleDateString('en-CA')
            } else {
                if (matches.groups?.year && matches.groups?.day && matches.groups?.month) {
                    date = `${rule.append_year_prefix ? "20" : ""}${matches.groups.year}-${matches.groups.month}-${matches.groups.day}`
                } else if (matches.groups?.date) {
                    date = new Date(matches.groups?.date).toLocaleDateString('en-CA')
                } else {
                    throw Error("Could not parse date. Make sure you define either a 'date' group or a 'year', 'month' and 'day' groups in your regular expression.")
                }
            }

            transaction = {
                account: rule.account,
                date: date,
                amount: parseFloat(matches.groups?.amount.replace(/,/g, '')),
                to_account: rule.to_account,
                payee_name: matches.groups?.payee_name,
                type: rule.type,
                cleared: rule.cleared,
                currency: matches.groups?.currency,
                notes: matches.groups?.notes,
                fx_fee_percent: rule.fx_fee_percent,
                account_currency: rule.account_currency
            }
            break;
        }
    }
    if (!transaction) {
        throw Error("Couldn't find a matching regular expression for the provided sender.")
    }
    return transaction
}