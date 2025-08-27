import { payloadValidator, configValidator } from './validators';
import { RequestPayload } from './app';
import { TransactionParser } from './parser';

describe('validators', () => {
  describe('payloadValidator', () => {
    it('should return true for a valid payload', () => {
      const validPayload: RequestPayload = {
        api_key: 'test_key',
        sms_sender: 'sender',
        sms: 'sms body',
      };
      expect(payloadValidator(validPayload)).toBe(true);
    });

    it('should return false if api_key is missing', () => {
      const invalidPayload = {
        sms_sender: 'sender',
        sms: 'sms body',
      };
      expect(payloadValidator(invalidPayload)).toBe(false);
    });

    it('should return false if sms_sender is missing', () => {
      const invalidPayload = {
        api_key: 'test_key',
        sms: 'sms body',
      };
      expect(payloadValidator(invalidPayload)).toBe(false);
    });

    it('should return false if sms is missing', () => {
      const invalidPayload = {
        api_key: 'test_key',
        sms_sender: 'sender',
      };
      expect(payloadValidator(invalidPayload)).toBe(false);
    });

    it('should return false for extra properties', () => {
      const invalidPayload = {
        api_key: 'test_key',
        sms_sender: 'sender',
        sms: 'sms body',
        extra: 'property',
      };
      expect(payloadValidator(invalidPayload)).toBe(false);
    });
  });

  describe('configValidator', () => {
    it('should return true for a valid config', () => {
      const validConfig: Record<string, TransactionParser[]> = {
        'TestSender': [
          {
            regex: 'Amount: (?<amount>\\d+)',
            account: 'Test Account',
            type: 'outflow',
            append_year_prefix: false,
            cleared: true,
          },
        ],
      };
      expect(configValidator(validConfig)).toBe(true);
    });

    it('should return false for an empty config', () => {
      const invalidConfig = {};
      expect(configValidator(invalidConfig)).toBe(false);
    });

    it('should return false if items array is empty', () => {
      const invalidConfig = {
        'TestSender': [],
      };
      expect(configValidator(invalidConfig)).toBe(false);
    });

    it('should return false if regex is missing', () => {
      const invalidConfig = {
        'TestSender': [
          {
            account: 'Test Account',
            type: 'outflow',
            append_year_prefix: false,
            cleared: true,
          },
        ],
      };
      expect(configValidator(invalidConfig)).toBe(false);
    });

    it('should return false if type has an invalid value', () => {
        const invalidConfig = {
            'TestSender': [
              {
                regex: 'Amount: (?<amount>\\d+)',
                account: 'Test Account',
                type: 'invalid_type',
                append_year_prefix: false,
                cleared: true,
              },
            ],
          };
          expect(configValidator(invalidConfig)).toBe(false);
    });

    it('should return false for additional properties', () => {
        const invalidConfig = {
            'TestSender': [
              {
                regex: 'Amount: (?<amount>\\d+)',
                account: 'Test Account',
                type: 'outflow',
                append_year_prefix: false,
                cleared: true,
                extra_prop: 'some_value'
              },
            ],
          };
          expect(configValidator(invalidConfig)).toBe(false);
    });
  });
});
