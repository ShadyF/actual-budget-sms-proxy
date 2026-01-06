// Compile AJV
import Ajv, {JSONSchemaType} from "ajv"
import {SMSRequestPayload, TransactionRequestPayload} from "./types/api";
import {SMSParserRule} from "./types";
import addFormats from "ajv-formats";

const ajv = new Ajv()
addFormats(ajv, ["date", "uuid", "regex"])

// JSON Schemas
const smsPayloadSchema: JSONSchemaType<SMSRequestPayload> = {
    type: "object",
    properties: {
        api_key: {type: "string"},
        sms_sender: {type: "string"},
        sms: {type: "string"}
    },
    required: ["api_key", "sms_sender", "sms"],
    additionalProperties: false
}

const configSchema: JSONSchemaType<Record<string, SMSParserRule[]>> = {
    type: "object",
    patternProperties: {
        "^.+$": {
            type: "array",
            minItems: 1,
            items: {
                type: "object",
                properties: {
                    "regex": {type: "string", format: "regex"},
                    "account": {type: "string"},
                    "to_account": {type: "string", nullable: true},
                    "type": {type: "string", enum: ["inflow", "outflow"]},
                    "append_year_prefix": {type: "boolean"},
                    "cleared": {type: "boolean"},
                    "fx_fee_percent": {type: "number", nullable: true},
                    "account_currency": {type: "string", nullable: true},
                    "auto_add_date": {type: "boolean", nullable: true}
                },
                required: ['regex', 'account', "type", "append_year_prefix", "cleared"],
                additionalProperties: false,
            }
        }
    },
    required: [],
    additionalProperties: false,
    minProperties: 1
}

const apiTransactionPayloadSchema: JSONSchemaType<TransactionRequestPayload> = {
    type: "object",
    properties: {
        api_key: {type: "string"},
        account: {type: "string"},
        date: {type: "string"},
        amount: {type: "number"},
        to_account: {type: "string", nullable: true},
        payee_name: {type: "string", nullable: true},
        type: {type: "string", enum: ["inflow", "outflow"]},
        cleared: {type: "boolean"},
        currency: {type: "string", nullable: true},
        notes: {type: "string", nullable: true},
        fx_fee_percent: {type: "number", nullable: true},
        account_currency: {type: "string", nullable: true}
    },
    required: ["api_key", "account", "date", "amount", "type", "cleared"],
    additionalProperties: false
}

export const smsPayloadValidator = ajv.compile(smsPayloadSchema)
export const configValidator = ajv.compile(configSchema)
export const apiTransactionPayloadValidator = ajv.compile(apiTransactionPayloadSchema)
