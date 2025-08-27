import request from 'supertest';
import * as actualAPI from '@actual-app/api';
import axios from 'axios';
import fs from 'fs';
import {parseSMS, TransactionData} from './parser';

// Mocking dependencies
jest.mock('@actual-app/api');
jest.mock('axios');
jest.mock('fs');
jest.mock('./parser');

const mockedActualAPI = actualAPI as jest.Mocked<typeof actualAPI>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedParseSMS = parseSMS as jest.Mock;

// Mock the config file read before importing the app
mockedFs.readFileSync.mockReturnValue(JSON.stringify({
    "TestSender": [{
        "regex": ".*",
        "account": "Test Account",
        "type": "outflow",
        "append_year_prefix": false,
        "cleared": true
    }]
}));

// Set up mock environment variables
process.env.API_KEY = 'test-api-key';
process.env.SERVER_PORT = '8081';
process.env.ACTUAL_SERVER_PROTOCOL = 'http';
process.env.ACTUAL_SERVER_HOST = 'localhost';
process.env.ACTUAL_SERVER_PORT = '5006';
process.env.ACTUAL_SERVER_PASSWORD = 'password';
process.env.ACTUAL_SERVER_BUDGET_ID = 'budget-id';
process.env.CONFIG_FILE_PATH = './config.test.json';
process.env.MAIN_CURRENCY = 'egp';
process.env.FX_FEE_PERCENT = '0.1';
process.env.NODE_ENV = 'test';

// We need to import the app after setting the environment variables
import { app, initializeApp } from './app';

describe('POST /transactions', () => {
  beforeAll(async () => {
    // Mock the api calls for initialization and run it
    mockedActualAPI.getAccounts.mockResolvedValue([{ id: 'acc1', name: 'Test Account', offbudget: false, closed: false }]);
    mockedActualAPI.getPayees.mockResolvedValue([]);
    await initializeApp();
  });

  afterAll(() => {
    // No need to close server, as it's not started in test mode
  });
  const validPayload = {
    api_key: 'test-api-key',
    sms_sender: 'TestSender',
    sms: 'A valid sms body',
  };

  const parsedSmsData: TransactionData = {
    account: 'Test Account',
    date: '2023-10-27',
    amount: 100,
    type: 'outflow',
    cleared: true,
  };

  beforeEach(() => {
    // Reset mocks that are called inside the tests
    mockedActualAPI.importTransactions.mockClear();
    mockedAxios.get.mockClear();
    mockedParseSMS.mockClear();

    // Mock the parser for a default successful parse
    mockedParseSMS.mockReturnValue(parsedSmsData);
    // Mock the amountToInteger utility
    mockedActualAPI.utils.amountToInteger.mockImplementation(amount => Math.round(amount * 100));
    mockedActualAPI.importTransactions.mockResolvedValue(undefined);
  });

  it('should return 201 for a valid transaction', async () => {
    await request(app)
      .post('/transactions')
      .send(validPayload)
      .expect(201);

    expect(mockedParseSMS).toHaveBeenCalledWith('TestSender', 'A valid sms body', expect.any(Object));
    expect(mockedActualAPI.importTransactions).toHaveBeenCalledWith('acc1', [
      expect.objectContaining({
        amount: -10000, // 100 * 100 * -1 (outflow)
      }),
    ]);
  });

  it('should return 401 for an invalid api_key', async () => {
    await request(app)
      .post('/transactions')
      .send({ ...validPayload, api_key: 'wrong-key' })
      .expect(401);
  });

  it('should return 403 for an invalid payload', async () => {
    await request(app)
      .post('/transactions')
      .send({ api_key: 'test-api-key' }) // missing sms and sms_sender
      .expect(403);
  });

  it('should return 400 if SMS parsing fails', async () => {
    mockedParseSMS.mockImplementation(() => {
      throw new Error('Parsing failed');
    });

    await request(app)
      .post('/transactions')
      .send(validPayload)
      .expect(400)
      .then(response => {
          expect(response.body.errors).toBe('Parsing failed');
      });
  });

  it('should handle currency conversion correctly', async () => {
    const fxSmsData = { ...parsedSmsData, currency: 'usd', amount: 10 }; // 10 USD
    mockedParseSMS.mockReturnValue(fxSmsData);
    mockedAxios.get.mockResolvedValue({
      data: {
        usd: {
          egp: 30.0, // 1 USD = 30 EGP
        },
      },
    });

    await request(app)
      .post('/transactions')
      .send(validPayload)
      .expect(201);

    // 10 USD * 30 EGP/USD * (1 + 10% fee) = 330 EGP
    const expectedAmount = 330;
    expect(mockedActualAPI.importTransactions).toHaveBeenCalledWith('acc1', [
        expect.objectContaining({
          amount: -expectedAmount * 100, // -33000
          notes: expect.stringContaining('10 usd (30.00 EGP FX Rate)'),
        }),
      ]);
  });

  it('should warn if account is not found but still process', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Re-initialize app with a different set of accounts
      mockedActualAPI.getAccounts.mockResolvedValue([{ id: 'other-acc', name: 'Another Account', offbudget: false, closed: false }]);
      await initializeApp();

      await request(app)
        .post('/transactions')
        .send(validPayload)
        .expect(201);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Could not find ID of account named Test Account"));
      // The transaction is still imported, but with a null accountId
      expect(mockedActualAPI.importTransactions).toHaveBeenCalledWith(undefined, expect.any(Array));

      // Restore original mocks and re-initialize for other tests
      consoleWarnSpy.mockRestore();
      mockedActualAPI.getAccounts.mockResolvedValue([{ id: 'acc1', name: 'Test Account', offbudget: false, closed: false }]);
      await initializeApp();
  });
});
