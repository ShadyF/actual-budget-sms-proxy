import request from "supertest";
import * as actualAPI from "@actual-app/api";

jest.mock("@actual-app/api", () => ({
    init: jest.fn(),
    downloadBudget: jest.fn(),
    getAccounts: jest.fn(() => Promise.resolve([])),
    getPayees: jest.fn(() => Promise.resolve([])),
    importTransactions: jest.fn(),
    shutdown: jest.fn(),
    utils: {
        amountToInteger: jest.fn((amt) => Math.round(amt * 100))
    }
}));

jest.mock("axios");
jest.mock("fs", () => ({
    ...jest.requireActual("fs"),
    readFileSync: jest.fn((path) => {
        if (path === "./config.json" || path === "./config.example.json" || path === "./scripts/config.json") {
            return JSON.stringify({ 
                "Bank": [{ 
                    regex: "Transaction of (?<amount>\\d+) EGP", 
                    account: "Checking", 
                    type: "outflow", 
                    append_year_prefix: false, 
                    cleared: true,
                    auto_add_date: true
                }] 
            });
        }
        return jest.requireActual("fs").readFileSync(path);
    }),
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn()
}));

import { app } from "../src/app";
import { accountsList } from "../src/actual";

const API_KEY = process.env.API_KEY || "test-key";

describe("Endpoints", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        accountsList.length = 0;
        accountsList.push({ id: "acc1", name: "Checking", offbudget: false, closed: false });
    });

    describe("POST /sms-transaction", () => {
        it("should return 201 and process transaction for valid SMS", async () => {
            const response = await request(app)
                .post("/sms-transaction")
                .send({
                    api_key: API_KEY,
                    sms_sender: "Bank",
                    sms: "Transaction of 100 EGP"
                });

            expect(response.status).toBe(201);
            expect(actualAPI.importTransactions).toHaveBeenCalledWith("acc1", expect.arrayContaining([
                expect.objectContaining({
                    amount: -10000
                })
            ]));
        });

        it("should return 401 for invalid API key", async () => {
            const response = await request(app)
                .post("/sms-transaction")
                .send({
                    api_key: "wrong-key",
                    sms_sender: "Bank",
                    sms: "Transaction of 100 EGP"
                });

            expect(response.status).toBe(401);
        });
    });

    describe("POST /transaction", () => {
        it("should return 201 and process transaction for valid payload", async () => {
            const response = await request(app)
                .post("/transaction")
                .send({
                    api_key: API_KEY,
                    account: "Checking",
                    date: "2023-10-01",
                    amount: 50.5,
                    type: "inflow",
                    cleared: true
                });

            expect(response.status).toBe(201);
            expect(actualAPI.importTransactions).toHaveBeenCalledWith("acc1", [{
                date: "2023-10-01",
                payee: undefined,
                payee_name: undefined,
                amount: 5050,
                notes: undefined,
                cleared: true
            }]);
        });

        it("should return 403 for invalid payload", async () => {
            const response = await request(app)
                .post("/transaction")
                .send({
                    api_key: API_KEY,
                    account: "Checking",
                    // date missing
                    amount: 50.5,
                    type: "inflow",
                    cleared: true
                });

            expect(response.status).toBe(403);
        });
    });
});
