import * as actualAPI from "@actual-app/api";
import axios from "axios";

// Mock dependencies BEFORE importing app
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
jest.mock("../src/env", () => ({
    env: {
        MAIN_CURRENCY: "egp",
        FX_FEE_PERCENT: 0.1,
        NODE_ENV: "test"
    }
}));
jest.mock("fs", () => ({
    ...jest.requireActual("fs"),
    readFileSync: jest.fn((path) => {
        if (path === "./config.json" || path === "./config.example.json" || path === "./scripts/config.json") {
            return JSON.stringify({ "Sender": [{ regex: ".*", account: "Checking", type: "outflow", append_year_prefix: false, cleared: true }] });
        }
        return jest.requireActual("fs").readFileSync(path);
    }),
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn()
}));

// Now import app
import { processAndImportTransaction, accountsList, transferAccountsList } from "../src/actual";

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("processAndImportTransaction", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup mock accounts
        accountsList.length = 0;
        accountsList.push({ id: "acc1", name: "Checking", offbudget: false, closed: false });
        
        transferAccountsList.length = 0;
        transferAccountsList.push({ id: "tr1", name: "Savings", category: null, transfer_acct: "acc2" });
    });

    it("should import a simple transaction without currency conversion", async () => {
        const transactionData = {
            account: "Checking",
            date: "2023-10-01",
            amount: 100,
            type: "outflow" as const,
            cleared: true,
            payee_name: "Coffee Shop"
        };

        await processAndImportTransaction(transactionData);

        expect(actualAPI.importTransactions).toHaveBeenCalledWith("acc1", [{
            date: "2023-10-01",
            payee: undefined,
            payee_name: "Coffee Shop",
            amount: -10000,
            notes: undefined,
            cleared: true
        }]);
    });

    it("should handle currency conversion", async () => {
        const transactionData = {
            account: "Checking",
            date: "2023-10-01",
            amount: 10,
            type: "outflow" as const,
            cleared: true,
            currency: "USD"
        };

        // Mock currency API response
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                usd: {
                    egp: 30 // Assuming MAIN_CURRENCY is egp
                }
            }
        });

        await processAndImportTransaction(transactionData);

        // 10 USD * 30 = 300 EGP. 
        // FX Fee 10% (0.1) -> 300 * 1.1 = 330
        
        expect(actualAPI.importTransactions).toHaveBeenCalledWith("acc1", expect.arrayContaining([
            expect.objectContaining({
                amount: -33000 // 330 * 100
            })
        ]));
    });

    it("should use transfer account ID if to_account is provided", async () => {
        const transactionData = {
            account: "Checking",
            to_account: "Savings",
            date: "2023-10-01",
            amount: 100,
            type: "outflow" as const,
            cleared: true
        };

        await processAndImportTransaction(transactionData);

        expect(actualAPI.importTransactions).toHaveBeenCalledWith("acc1", [{
            date: "2023-10-01",
            payee: "tr1",
            payee_name: undefined,
            amount: -10000,
            notes: undefined,
            cleared: true
        }]);
    });
});
