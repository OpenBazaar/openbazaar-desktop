// Multiple test depend on this data. If you need to modify it please be absolutely
// sure you're not affecting tests that use it. To be safe, maybe it's best if you
// import it and then adjust it locally.

export const walletCurs = ['BCH', 'BTC', 'LTC', 'ZEC'];

export const walletCurDef = {
  AED: {
    code: 'AED',
    currencyType: 'fiat',
    divisibility: 2,
    name: 'UAE Dirham',
    testnetCode: '',
  },
  BCH: {
    code: 'BCH',
    currencyType: 'crypto',
    divisibility: 8,
    name: 'Bitcoin Cash',
    testnetCode: 'TBCH',
  },
  BTC: {
    code: 'BTC',
    currencyType: 'crypto',
    divisibility: 8,
    name: 'Bitcoin',
    testnetCode: 'TBTC',
  },
  LTC: {
    code: 'LTC',
    currencyType: 'crypto',
    divisibility: 8,
    name: 'Litecoin',
    testnetCode: 'TLTC',
  },
  PLN: {
    code: 'PLN',
    currencyType: 'fiat',
    divisibility: 2,
    name: 'Poland',
    testnetCode: '',
  },
  USD: {
    code: 'USD',
    currencyType: 'fiat',
    divisibility: 2,
    name: 'United States Dollar',
    testnetCode: '',
  },
  ZEC: {
    code: 'ZEC',
    currencyType: 'crypto',
    divisibility: 8,
    name: 'Zcash',
    testnetCode: 'ZEC',
  },
};
