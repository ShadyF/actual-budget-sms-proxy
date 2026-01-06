import * as envalid from 'envalid'
import 'dotenv/config'

export const env = envalid.cleanEnv(process.env, {
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
