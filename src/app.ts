import http from "http"
import * as envalid from 'envalid'

import {createTerminus} from "@godaddy/terminus"
import fs from "fs"
import * as actualAPI from "@actual-app/api"
import express from "express"
import axios from 'axios'
import {parseSMS, TransactionData, TransactionParser} from "./parser"
import {configValidator, payloadValidator} from "./validators"
import currency from 'currency.js'

const actualBudgetDataDir = './budget-data'

let accountsList: Account[] = []
let transferAccountsList: TransferAccount[] = []

interface TransferAccount {
    id: string
    name: string,
    category: string | null,
    transfer_acct: string | null
}

interface Account {
    id: string
    name: string
    offbudget: boolean
    closed: boolean
}

// Setup of environment variables
const env = envalid.cleanEnv(process.env, {
    API_KEY: envalid.str(),
    SERVER_PORT: envalid.port({default: 8080}),
    ACTUAL_SERVER_PROTOCOL: envalid.str({choices: ["http", "https"], default: "https"}),
    ACTUAL_SERVER_HOST: envalid.host(),
    ACTUAL_SERVER_PORT: envalid.port(),
    ACTUAL_SERVER_PASSWORD: envalid.str(),
    ACTUAL_SERVER_BUDGET_ID: envalid.str(),
    CONFIG_FILE_PATH: envalid.str({default: "./config.json"}),
    MAIN_CURRENCY: envalid.str({
        default: "egp",
        desc: "Main currency to use. Will do currency conversion for any transactions that are not in the main currency. Should be a 3 letter lowercase value"
    }),
    FX_FEE_PERCENT: envalid.num({
        default: 0.1,
        desc: "Factor for transactions that are not done in the MAIN_CURRENCY value. Default is 10%"
    }),
    NODE_ENV: envalid.str({choices: ['development', 'test', 'production', 'staging']}),
})

// Parse config file
const config: Record<string, TransactionParser[]> = JSON.parse(fs.readFileSync(env.CONFIG_FILE_PATH, 'utf8'))
if (!configValidator(config)) {
    console.error(configValidator.errors)
    throw Error(`Error when parsing config.`)
}


// Initialize ActualAPI
(async () => {
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
    accountsList = await actualAPI.getAccounts()

    // Pull account transfer ids
    console.log("Pulling Accounts Transfer IDs...")
    const payees: TransferAccount[] = await actualAPI.getPayees()
    transferAccountsList = payees.filter((payee) => payee.transfer_acct != null)

    // All done!
    console.log("Initialization Done!")
})();


export interface RequestPayload {
    api_key: string
    sms_sender: string
    sms: string
}

const app = express()
app.use(express.json());
app.post('/transactions', async (req, res) => {
    if (!payloadValidator(req.body)) {
        return res.status(403).send({"errors": payloadValidator.errors})
    }
    if (env.API_KEY !== req.body.api_key) {
        return res.sendStatus(401)
    }

    // Attempt to parse SMS
    let transactionData: TransactionData | null = null
    try {
        transactionData = parseSMS(req.body.sms_sender, req.body.sms, config)
    } catch (err: unknown) {
        if (err instanceof Error) {
            return res.status(400).send({"errors": err.message})
        }
        console.error("Uncaught error " + err)
        return res.sendStatus(400)
    }

    // Convert foreign currency to main currency
    if (transactionData.currency && transactionData.currency.toLowerCase() !== env.MAIN_CURRENCY) {
        for (const date of [transactionData.date, "latest"]) {
            try {
                const currencyResponse = await axios.get(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${transactionData.currency.toLowerCase()}.json`)
                const data = currencyResponse.data

                // Calculated the amount in the main currency
                const fxRate = data[transactionData.currency.toLowerCase()][env.MAIN_CURRENCY]

                // Use default FX Fee if fx_fee key not found in config
                const fxFeePercent = (transactionData.fx_fee_percent ? transactionData.fx_fee_percent : env.FX_FEE_PERCENT)

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
    let toAccountId = null
    if (transactionData.to_account) {
        toAccountId = transferAccountsList.find((account) => account.name === transactionData?.to_account)?.id
        if (!toAccountId) {
            console.warn(`Could not find ID of account named ${transactionData.to_account}. Please make sure the account name in your config matches the account name in Actual Budget.`)
        }
    }

    // Run actual import of transaction
    await actualAPI.importTransactions(accountId, [{
        date: transactionData.date,
        payee: toAccountId,
        payee_name: transactionData.payee_name,
        amount: actualAPI.utils.amountToInteger(transactionData.amount) * (transactionData.type == "outflow" ? -1 : 1),
        notes: transactionData.notes,
        cleared: transactionData.cleared
    }])

    return res.sendStatus(201)
})

// Setting up the server
const server = http.createServer(app)

async function onSignal() {
    await actualAPI.shutdown()
}

async function onHealthCheck() {
    return Promise.resolve()
}

createTerminus(server, {
    signal: 'SIGTERM',
    healthChecks: {'/healthz': onHealthCheck},
    onSignal
})

server.listen(env.SERVER_PORT, () => console.log(`Starting Actual Budget Transactions Proxy Server on Port ${env.SERVER_PORT}`))