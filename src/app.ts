import http from "http";
import * as envalid from 'envalid'

import {createTerminus} from "@godaddy/terminus";
import fs from "fs";
import * as actualAPI from "@actual-app/api";
import express from "express";

import Ajv, {JSONSchemaType} from "ajv"
import addFormats from "ajv-formats"

const ajv = new Ajv()
addFormats(ajv, ["date", "uuid"])
const app = express()
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
    NODE_ENV: envalid.str({choices: ['development', 'test', 'production', 'staging']}),
});

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
    // await actualAPI.importTransactions("62fc2ba4-f047-4d5d-98f9-7dc088481b5a", [{
    //     date: "2023-10-10",
    //     amount: actualAPI.utils.amountToInteger(500.2),
    //     notes: "This is a note",
    //     payee_name: "Adidas"
    // }])
    // await actualAPI.shutdown();
})();

interface TransactionData {
    api_key: string
    account: string
    date: string
    amount: number
    payee_name: string
    currency?: string
    notes?: string
}

// Compile AJV
const schema: JSONSchemaType<TransactionData> = {
    type: "object",
    properties: {
        api_key: {type: "string"},
        account: {type: "string", format: "uuid"},
        date: {type: "string", format: "date"},
        amount: {type: "number"},
        payee_name: {type: "string"},
        currency: {type: "string", nullable: true, minLength: 3, maxLength: 3},
        notes: {type: "string", nullable: true}
    },
    required: ["account", "date", "amount", "payee_name"],
    additionalProperties: false
}

const validate = ajv.compile(schema)

app.use(express.json());
app.post('/transactions', async (req, res) => {
    if (!validate(req.body)) {
        return res.status(403).send({"errors": validate.errors})
    }
    if (env.API_KEY !== req.body.api_key) {
        return res.send(401)
    }

    // Convert to EGP if foreign currency
    // Use API found here
    // Have in a try / catch to avoid issues

    // Run actual import of transaction
    const payload = req.body
    await actualAPI.importTransactions(payload.account, [{
        date: payload.date,
        payee_name: payload.payee_name,
        amount: actualAPI.utils.amountToInteger(payload.amount),
        notes: payload.notes
    }])

    return res.send(201)
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