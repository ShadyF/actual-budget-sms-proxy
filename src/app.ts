import http from "http";
import * as envalid from 'envalid'

import {createTerminus} from "@godaddy/terminus";
import fs from "fs";
import * as actualAPI from "@actual-app/api";
import express from "express";

import Ajv, {JSONSchemaType} from "ajv"

const ajv = new Ajv()
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
    const budget = await actualAPI.getAccounts();
    console.log(budget);
    await actualAPI.shutdown();
})();

interface MyData {
    foo: number
    bar?: string
}

// Compile AJV
const schema: JSONSchemaType<MyData> = {
    type: "object",
    properties: {
        foo: {type: "integer"},
        bar: {type: "string", nullable: true}
    },
    required: ["foo"],
    additionalProperties: false
}
const validate = ajv.compile(schema)

app.use(express.json());
app.post('/', async (req, res) => {
    // Check API key from request
    validate(req.body)
    console.log(req)
    res.status(201)
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