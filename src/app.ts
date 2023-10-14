import http from "http";
import * as envalid from 'envalid'

import {createTerminus} from "@godaddy/terminus";
import fs from "fs";
import * as actualAPI from "@actual-app/api";
import express from "express";
import axios from 'axios';
import {parseSMS, TransactionParser} from "./parser";
import {configValidator, payloadValidator} from "./validators";

const actualBudgetDataDir = './budget-data'

// Setup of environment variables
const env = envalid.cleanEnv(process.env, {
    API_KEY: envalid.str(),
    SERVER_PORT: envalid.port({default: 80}),
    ACTUAL_SERVER_PROCTOCOL: envalid.str({choices: ["http", "https"], default: "https"}),
    ACTUAL_SERVER_HOST: envalid.host(),
    ACTUAL_SERVER_PORT: envalid.port(),
    ACTUAL_SERVER_PASSWORD: envalid.str(),
    ACTUAL_SERVER_BUDGET_ID: envalid.str(),
    CONFIG_FILE_PATH: envalid.str({default: "./config.json"}),
    MAIN_CURRENCY: envalid.str({
        default: "egp",
        desc: "Main currency to use. Will do currency conversion for any transactions that are not in the main currency. Should be a 3 letter lowercase value"
    }),
    FOREIGN_CURRENCY_FACTOR: envalid.num({
        default: 1.1,
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
        serverURL: `${env.ACTUAL_SERVER_PROCTOCOL}://${env.ACTUAL_SERVER_HOST}:${env.ACTUAL_SERVER_PORT}`,
        // This is the password you use to log into the server
        password: env.ACTUAL_SERVER_PASSWORD,
    });

    // This is the ID from Settings → Show advanced settings → Sync ID
    await actualAPI.downloadBudget(env.ACTUAL_SERVER_BUDGET_ID);
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
    let transactionData = null
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
                const currencyResponse = await axios.get(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/${date}/currencies/${transactionData.currency.toLowerCase()}/${env.MAIN_CURRENCY}.json`)
                const data = currencyResponse.data
                // Calculated the amount in the main currency
                const convertedAmount = data[env.MAIN_CURRENCY] * transactionData.amount * env.FOREIGN_CURRENCY_FACTOR

                // Add a note of the original amount in the foreign currency
                const foreignCurrencyString = `${transactionData.amount} ${transactionData.currency}`
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

    // Run actual import of transaction
    await actualAPI.importTransactions(transactionData.account, [{
        date: transactionData.date,
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