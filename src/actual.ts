import * as actualAPI from "@actual-app/api"
import fs from "fs"
import axios from 'axios'
import currency from 'currency.js'
import {env} from "./env"
import {Account, TransferAccount, TransactionData} from "./types"

const actualBudgetDataDir = './budget-data'

export const accountsList: Account[] = []
export const transferAccountsList: TransferAccount[] = []

export async function initActual() {
    if (env.NODE_ENV === 'test') {
        return
    }
    if (!fs.existsSync(actualBudgetDataDir)) {
        fs.mkdirSync(actualBudgetDataDir);
    }

    await actualAPI.init({
        // Budget data will be cached locally here, in subdirectories for each file.
        dataDir: actualBudgetDataDir,
        // This is the URL of your running server
        serverURL: `${env.ACTUAL_SERVER_PROTOCOL}://${env.ACTUAL_SERVER_HOST}:${env.ACTUAL_SERVER_PORT}`,
        // This is the password you use to log into the server
        password: env.ACTUAL_SERVER_PASSWORD
    });

    // This is the ID from Settings → Show advanced settings → Sync ID
    console.log("Downloading Budget...")
    await actualAPI.downloadBudget(env.ACTUAL_SERVER_BUDGET_ID);

    // Pull account IDs
    console.log("Pulling Account IDs...")
    accountsList.length = 0
    accountsList.push(...await actualAPI.getAccounts())

    // Pull account transfer ids
    console.log("Pulling Accounts Transfer IDs...")
    const payees: TransferAccount[] = await actualAPI.getPayees()
    transferAccountsList.length = 0
    transferAccountsList.push(...payees.filter((payee) => payee.transfer_acct != null))

    // All done!
    console.log("Initialization Done!")
}

export async function shutdownActual() {
    await actualAPI.shutdown()
}

export async function processAndImportTransaction(transactionData: TransactionData): Promise<void> {
    // Calculates amount in MAIN_CURRENCY if a transaction was made using another currency
    if (transactionData.currency && transactionData.currency.toLowerCase() !== env.MAIN_CURRENCY) {
        for (const date of [transactionData.date, "latest"]) {
            try {
                const currencyResponse = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${transactionData.currency.toLowerCase()}.json`)
                const data = currencyResponse.data

                // Retrieve exchange rate to MAIN_CURRENCY
                const fxRate = data[transactionData.currency.toLowerCase()][env.MAIN_CURRENCY]

                // Set FX Fee as 0. Will check if FX Fees apply
                let fxFeePercent = 0

                // Use MAIN_CURRENCY as the account currency if account_currency not set in config
                const accountCurrency = transactionData.account_currency ? transactionData.account_currency : env.MAIN_CURRENCY

                // Do not add a FX Fee if the transaction's currency is the same as the account's currency
                if (transactionData.currency.toLowerCase() !== accountCurrency.toLowerCase()) {
                    // Use default FX Fee if fx_fee key not found in config
                    fxFeePercent = transactionData.fx_fee_percent ? transactionData.fx_fee_percent : env.FX_FEE_PERCENT
                }

                // Calculate the net amount in the MAIN_CURRENCY
                const convertedAmount = fxRate * transactionData.amount * (1 + fxFeePercent)

                // Add a note of the original amount in the foreign currency
                // Use currency.js here to do accurate rounding of fxRate. Could have been a good idea to use it throughout the app but was too lazy to do that
                const foreignCurrencyString = `${transactionData.amount} ${transactionData.currency} (${currency(fxRate, {precision: 2})} ${env.MAIN_CURRENCY.toUpperCase()} FX Rate)`
                transactionData.notes = transactionData.notes ? `${transactionData.notes} - ${foreignCurrencyString}` : foreignCurrencyString

                // Adjust the transaction amount to be in the main currency
                transactionData.amount = convertedAmount
                break
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    console.warn(`Error when using currency conversion API. Date: ${date} - Amount: ${transactionData.amount} ${transactionData.currency}})`)
                } else {
                    console.error(err)
                }
            }
        }
    }


    // Convert accounts names to IDs
    const accountId = accountsList.find((account) => account.name === transactionData?.account)?.id
    if (!accountId) {
        console.warn(`Could not find ID of account named ${transactionData.account}. Please make sure the account name in your config matches the account name in Actual Budget.`)
    }
    let toAccountId: string | undefined = undefined
    if (transactionData.to_account) {
        toAccountId = transferAccountsList.find((account) => account.name === transactionData?.to_account)?.id
        if (!toAccountId) {
            console.warn(`Could not find ID of account named ${transactionData.to_account}. Please make sure the account name in your config matches the account name in Actual Budget.`)
        }
    }

    // Run actual import of transaction
    // Replace this with addTransactions? Will not handle duplicates then
    await actualAPI.importTransactions(accountId, [{
        date: transactionData.date,
        payee: toAccountId,
        payee_name: transactionData.payee_name,
        amount: actualAPI.utils.amountToInteger(transactionData.amount) * (transactionData.type == "outflow" ? -1 : 1),
        notes: transactionData.notes,
        cleared: transactionData.cleared
    }])
}
