import http from "http";
import * as envalid from 'envalid'

import {createTerminus} from "@godaddy/terminus";
import fs from "fs";
import * as actualAPI from "@actual-app/api";
import express from "express";

const Ajv = require("ajv").default
const ajv = new Ajv()
const app = express()
const pino = require('pino-http')()
const port = 8080
const actualBudgetDataDir = './budget-data'

const env = envalid.cleanEnv(process.env, {
    API_KEY: envalid.str(),
    ACTUAL_SERVER_PROCTOCOL: envalid.str({choices: ["http", "https"], default: "https"}),
    ACTUAL_SERVER_HOST: envalid.host(),
    ACTUAL_SERVER_PORT: envalid.port(),
    ACTUAL_SERVER_PASSWORD: envalid.str(),
    ACTUAL_SERVER_BUDGET_ID: envalid.str(),
    NODE_ENV: envalid.str({choices: ['development', 'test', 'production', 'staging']}),
});


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
    const budget = await actualAPI.getAccounts();
    console.log(budget);
    await actualAPI.shutdown();
})();

// Compile AJV
const schema = {
    type: "object",
    properties: {
        api_key: {type: "string"},
        amount: {type: "integer"},
        currency: {type: "string"},
        bar: {type: "string"}
    },
    required: ["foo"],
    additionalProperties: false
}
const validate = ajv.compile(schema)

app.use(pino)
app.use(express.json());
app.post('/', async (req, res) => {
    // Check API key from request
    // req.log.info("Nice!")
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

server.listen(port)