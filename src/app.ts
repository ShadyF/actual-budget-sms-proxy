import http from "http"
import {createTerminus} from "@godaddy/terminus"
import express from "express"
import {parseSMS} from "./parser"
import {TransactionData} from "./types"
import {smsPayloadValidator, apiTransactionPayloadValidator} from "./validators"
import {env} from "./env"
import {config} from "./config"
import {initActual, shutdownActual, processAndImportTransaction} from "./actual"

// Initialize ActualAPI
initActual();

export const app = express()
app.use(express.json());

// Endpoint to parse raw SMS data.
app.post('/sms-transaction', async (req, res) => {
    if (!smsPayloadValidator(req.body)) {
        return res.status(403).send({"errors": smsPayloadValidator.errors})
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

    await processAndImportTransaction(transactionData)

    return res.sendStatus(201)
})

// Endpoint to receive and sync pre-structured transaction data directly to Actual Budget.
app.post('/transaction', async (req, res) => {
    if (!apiTransactionPayloadValidator(req.body)) {
        return res.status(403).send({"errors": apiTransactionPayloadValidator.errors})
    }
    if (env.API_KEY !== req.body.api_key) {
        return res.sendStatus(401)
    }

    await processAndImportTransaction(req.body)

    return res.sendStatus(201)
})

// Setting up the server
const server = http.createServer(app)

async function onSignal() {
    await shutdownActual()
}

async function onHealthCheck() {
    return Promise.resolve()
}

createTerminus(server, {
    signal: 'SIGTERM',
    healthChecks: {'/healthz': onHealthCheck},
    onSignal
})

if (env.NODE_ENV !== 'test') {
    server.listen(env.SERVER_PORT, () => console.log(`Starting Actual Budget Transactions Proxy Server on Port ${env.SERVER_PORT}`))
}