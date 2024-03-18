// Compile AJV
import Ajv, {JSONSchemaType} from "ajv"
import {RequestPayload} from "./app";
import addFormats from "ajv-formats";
import {TransactionParser} from "./parser";

const ajv = new Ajv()
addFormats(ajv, ["date", "uuid", "regex"])

// JSON Schemas
const payloadSchema: JSONSchemaType<RequestPayload> = {
    type: "object",
    properties: {
        api_key: {type: "string"},
        sms_sender: {type: "string"},
        sms: {type: "string"}
    },
    required: ["api_key", "sms_sender", "sms"],
    additionalProperties: false
}

const configSchema: JSONSchemaType<Record<string, TransactionParser[]>> = {
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

export const payloadValidator = ajv.compile(payloadSchema)
export const configValidator = ajv.compile(configSchema)
