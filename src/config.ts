import fs from "fs"
import {env} from "./env"
import {configValidator} from "./validators"
import {SMSParserRule} from "./types"

export const config: Record<string, SMSParserRule[]> = JSON.parse(fs.readFileSync(env.CONFIG_FILE_PATH, 'utf8'))

if (!configValidator(config)) {
    console.error(configValidator.errors)
    throw Error(`Error when parsing config.`)
}
