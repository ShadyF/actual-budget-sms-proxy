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

export interface SMSParserRule {
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

    // Automatically adds today's date instead of parsing date from SMS
    // Needed when body does not contain any date data
    auto_add_date?: boolean
}

export interface TransferAccount {
    id: string
    name: string,
    category: string | null,
    transfer_acct: string | null
}

export interface Account {
    id: string
    name: string
    offbudget: boolean
    closed: boolean
}
