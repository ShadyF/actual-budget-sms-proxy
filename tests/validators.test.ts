import { smsPayloadValidator, apiTransactionPayloadValidator, configValidator } from "../src/validators";

describe("Validators", () => {
    describe("smsPayloadValidator", () => {
        it("should validate a valid SMSRequestPayload", () => {
            const validPayload = {
                api_key: "test-key",
                sms_sender: "Bank",
                sms: "Transaction of 100 EGP"
            };
            expect(smsPayloadValidator(validPayload)).toBe(true);
        });

        it("should fail if api_key is missing", () => {
            const invalidPayload = {
                sms_sender: "Bank",
                sms: "Transaction of 100 EGP"
            };
            expect(smsPayloadValidator(invalidPayload)).toBe(false);
        });
    });

    describe("apiTransactionPayloadValidator", () => {
        it("should validate a valid TransactionRequestPayload", () => {
            const validPayload = {
                api_key: "test-key",
                account: "Checking",
                date: "2023-10-01",
                amount: 100.50,
                type: "outflow",
                cleared: true
            };
            expect(apiTransactionPayloadValidator(validPayload)).toBe(true);
        });

        it("should validate a valid TransactionRequestPayload with optional fields", () => {
            const validPayload = {
                api_key: "test-key",
                account: "Checking",
                date: "2023-10-01",
                amount: 100.50,
                type: "outflow",
                cleared: true,
                to_account: "Savings",
                payee_name: "Coffee Shop",
                currency: "USD",
                notes: "Morning coffee",
                fx_fee_percent: 0.02,
                account_currency: "EGP"
            };
            expect(apiTransactionPayloadValidator(validPayload)).toBe(true);
        });

        it("should fail if mandatory fields are missing", () => {
            const invalidPayload = {
                api_key: "test-key",
                account: "Checking",
                // date missing
                amount: 100.50,
                type: "outflow",
                cleared: true
            };
            expect(apiTransactionPayloadValidator(invalidPayload)).toBe(false);
        });

        it("should fail if type is invalid", () => {
            const invalidPayload = {
                api_key: "test-key",
                account: "Checking",
                date: "2023-10-01",
                amount: 100.50,
                type: "invalid",
                cleared: true
            };
            expect(apiTransactionPayloadValidator(invalidPayload)).toBe(false);
        });
    });

    describe("configValidator", () => {
        it("should validate a valid config", () => {
            const validConfig = {
                "Bank": [
                    {
                        regex: "test",
                        account: "Checking",
                        type: "outflow",
                        append_year_prefix: false,
                        cleared: true
                    }
                ]
            };
            expect(configValidator(validConfig)).toBe(true);
        });

        it("should fail if required fields in parser are missing", () => {
            const invalidConfig = {
                "Bank": [
                    {
                        regex: "test",
                        account: "Checking",
                        // type missing
                        append_year_prefix: false,
                        cleared: true
                    }
                ]
            };
            expect(configValidator(invalidConfig)).toBe(false);
        });
    });
});
