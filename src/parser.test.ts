import { parseSMS, TransactionParser } from './parser';

describe('parseSMS', () => {
  const config: Record<string, TransactionParser[]> = {
    'TestSender': [
      {
        regex: 'Purchase of (?<amount>[\\d,.]+) USD at (?<payee_name>.+). Rate (?<fx_rate>\\d+). Notes: (?<notes>.+)',
        account: 'Credit Card',
        type: 'outflow',
        append_year_prefix: false,
        cleared: false,
      },
      {
        regex: 'Paid (?<amount>[\\d,.]+) to (?<payee_name>.+?) on (?<date>\\d{4}-\\d{2}-\\d{2})',
        account: 'Bank Account',
        type: 'outflow',
        append_year_prefix: false,
        cleared: true,
      },
    ],
    'DateTester': [
        {
            regex: 'Transaction on (?<day>\\d{2})-(?<month>\\d{2})-(?<year>\\d{2}) for (?<amount>[\\d,.]+)',
            account: 'Dated Account',
            type: 'inflow',
            append_year_prefix: true,
            cleared: true,
        }
    ],
    'AutoDate': [
        {
            regex: 'You spent (?<amount>[\\d,.]+) at (?<payee_name>.+)',
            account: 'Auto Date Account',
            type: 'outflow',
            append_year_prefix: false,
            cleared: true,
            auto_add_date: true
        }
    ]
  };

  it('should parse a standard SMS correctly', () => {
    const sms = 'Paid 1,234.56 to Test Merchant on 2023-10-26';
    const result = parseSMS('TestSender', sms, config);
    expect(result).toEqual({
      account: 'Bank Account',
      date: '2023-10-26',
      amount: 1234.56,
      to_account: undefined,
      payee_name: 'Test Merchant',
      type: 'outflow',
      cleared: true,
      currency: undefined,
      notes: undefined,
      fx_fee_percent: undefined,
      account_currency: undefined
    });
  });

  it('should handle commas in the amount', () => {
    const sms = 'Paid 1,234,567.89 to Test Merchant on 2023-10-26';
    const result = parseSMS('TestSender', sms, config);
    expect(result.amount).toBe(1234567.89);
  });

  it('should throw an error if sender is not in config', () => {
    const sms = 'Some random SMS';
    expect(() => parseSMS('UnknownSender', sms, config)).toThrow('Could not find SMS Sender in provided financial entities config.');
  });

  it('should throw an error if no regex matches', () => {
    const sms = 'This SMS will not match any regex';
    expect(() => parseSMS('TestSender', sms, config)).toThrow("Couldn't find a matching regular expression for the provided sender.");
  });

  it('should correctly parse a date with year prefix to be appended', () => {
    const sms = 'Transaction on 26-10-23 for 500';
    const result = parseSMS('DateTester', sms, config);
    expect(result.date).toBe('2023-10-26');
  });

  it('should use the current date if auto_add_date is true', () => {
    const sms = 'You spent 100 at Some Store';
    const result = parseSMS('AutoDate', sms, config);
    const today = new Date().toLocaleDateString('en-CA');
    expect(result.date).toBe(today);
  });

  it('should throw an error if date cannot be parsed', () => {
    const invalidConfig: Record<string, TransactionParser[]> = {
        'BadDate': [{
            regex: 'Amount: (?<amount>\\d+)',
            account: 'Bad Date Account',
            type: 'outflow',
            append_year_prefix: false,
            cleared: false
        }]
    };
    const sms = 'Amount: 500';
    expect(() => parseSMS('BadDate', sms, invalidConfig)).toThrow("Could not parse date. Make sure you define either a 'date' group or a 'year', 'month' and 'day' groups in your regular expression.");
  });
});
