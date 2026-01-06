import {TransactionData} from "./index";

export interface SMSRequestPayload {
    api_key: string
    sms_sender: string
    sms: string
}

export interface TransactionRequestPayload extends TransactionData {
    api_key: string;
}
