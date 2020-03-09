import _ from 'underscore';
import app from '../app';
import {
  getCurrencyByCode as getCryptoCurByCode,
  supportedWalletCurs,
  ensureMainnetCode,
} from './walletCurrencies';

const currencies = [
  {
    name: 'Afghani',
    code: 'AFN',
  },
  {
    name: 'Euro',
    code: 'EUR',
  },
  {
    name: 'Lek',
    code: 'ALL',
  },
  {
    name: 'Algerian Dinar',
    code: 'DZD',
  },
  {
    name: 'United States Dollar',
    code: 'USD',
  },
  {
    name: 'Kwanza',
    code: 'AOA',
  },
  {
    name: 'East Caribbean Dollar',
    code: 'XCD',
  },
  {
    name: 'Argentine Peso',
    code: 'ARS',
  },
  {
    name: 'Armenian Dram',
    code: 'AMD',
  },
  {
    name: 'Aruban Florin',
    code: 'AWG',
  },
  {
    name: 'Australian Dollar',
    code: 'AUD',
  },
  {
    name: 'Azerbaijanian Manat',
    code: 'AZN',
  },
  {
    name: 'Bahamian Dollar',
    code: 'BSD',
  },
  {
    name: 'Bahraini Dinar',
    code: 'BHD',
  },
  {
    name: 'Taka',
    code: 'BDT',
  },
  {
    name: 'Barbados Dollar',
    code: 'BBD',
  },
  {
    name: 'Belarussian Ruble',
    code: 'BYR',
  },
  {
    name: 'Belize Dollar',
    code: 'BZD',
  },
  {
    name: 'CFA Franc BCEAO',
    code: 'XOF',
  },
  {
    name: 'Bermudian Dollar',
    code: 'BMD',
  },
  {
    name: 'Ngultrum',
    code: 'BTN',
  },
  {
    name: 'Boliviano',
    code: 'BOB',
  },
  {
    name: 'Convertible Mark',
    code: 'BAM',
  },
  {
    name: 'Pula',
    code: 'BWP',
  },
  {
    name: 'Norwegian Krone',
    code: 'NOK',
  },
  {
    name: 'Brazilian Real',
    code: 'BRL',
  },
  {
    name: 'Brunei Dollar',
    code: 'BND',
  },
  {
    name: 'Bulgarian Lev',
    code: 'BGN',
  },
  {
    name: 'Burundi Franc',
    code: 'BIF',
  },
  {
    name: 'Cabo Verde Escudo',
    code: 'CVE',
  },
  {
    name: 'Riel',
    code: 'KHR',
  },
  {
    name: 'CFA Franc BEAC',
    code: 'XAF',
  },
  {
    name: 'Canadian Dollar',
    code: 'CAD',
  },
  {
    name: 'Cayman Islands Dollar',
    code: 'KYD',
  },
  {
    name: 'Chilean Peso',
    code: 'CLP',
  },
  {
    name: 'Yuan Renminbi',
    code: 'CNY',
  },
  {
    name: 'Colombian Peso',
    code: 'COP',
  },
  {
    name: 'Comoro Franc',
    code: 'KMF',
  },
  {
    name: 'Congolese Franc',
    code: 'CDF',
  },
  {
    name: 'New Zealand Dollar',
    code: 'NZD',
  },
  {
    name: 'Costa Rican Colon',
    code: 'CRC',
  },
  {
    name: 'Kuna',
    code: 'HRK',
  },
  {
    name: 'Cuban Peso',
    code: 'CUP',
  },
  {
    name: 'Netherlands Antillean Guilder',
    code: 'ANG',
  },
  {
    name: 'Czech Koruna',
    code: 'CZK',
  },
  {
    name: 'Danish Krone',
    code: 'DKK',
  },
  {
    name: 'Djibouti Franc',
    code: 'DJF',
  },
  {
    name: 'Dominican Peso',
    code: 'DOP',
  },
  {
    name: 'Egyptian Pound',
    code: 'EGP',
  },
  {
    name: 'El Salvador Colon',
    code: 'SVC',
  },
  {
    name: 'Nakfa',
    code: 'ERN',
  },
  {
    name: 'Ethiopian Birr',
    code: 'ETB',
  },
  {
    name: 'Falkland Islands Pound',
    code: 'FKP',
  },
  {
    name: 'Fiji Dollar',
    code: 'FJD',
  },
  {
    name: 'CFP Franc',
    code: 'XPF',
  },
  {
    name: 'Dalasi',
    code: 'GMD',
  },
  {
    name: 'Lari',
    code: 'GEL',
  },
  {
    name: 'Ghana Cedi',
    code: 'GHS',
  },
  {
    name: 'Gibraltar Pound',
    code: 'GIP',
  },
  {
    name: 'Quetzal',
    code: 'GTQ',
  },
  {
    name: 'Pound Sterling',
    code: 'GBP',
  },
  {
    name: 'Guinea Franc',
    code: 'GNF',
  },
  {
    name: 'Guyana Dollar',
    code: 'GYD',
  },
  {
    name: 'Gourde',
    code: 'HTG',
  },
  {
    name: 'Lempira',
    code: 'HNL',
  },
  {
    name: 'Hong Kong Dollar',
    code: 'HKD',
  },
  {
    name: 'Forint',
    code: 'HUF',
  },
  {
    name: 'Iceland Krona',
    code: 'ISK',
  },
  {
    name: 'Indian Rupee',
    code: 'INR',
  },
  {
    name: 'Rupiah',
    code: 'IDR',
  },
  {
    name: 'Iranian Rial',
    code: 'IRR',
  },
  {
    name: 'Iraqi Dinar',
    code: 'IQD',
  },
  {
    name: 'New Israeli Sheqel',
    code: 'ILS',
  },
  {
    name: 'Jamaican Dollar',
    code: 'JMD',
  },
  {
    name: 'Yen',
    code: 'JPY',
  },
  {
    name: 'Jordanian Dinar',
    code: 'JOD',
  },
  {
    name: 'Tenge',
    code: 'KZT',
  },
  {
    name: 'Kenyan Shilling',
    code: 'KES',
  },
  {
    name: 'North Korean Won',
    code: 'KPW',
  },
  {
    name: 'Won',
    code: 'KRW',
  },
  {
    name: 'Kuwaiti Dinar',
    code: 'KWD',
  },
  {
    name: 'Som',
    code: 'KGS',
  },
  {
    name: 'Kip',
    code: 'LAK',
  },
  {
    name: 'Lebanese Pound',
    code: 'LBP',
  },
  {
    name: 'Loti',
    code: 'LSL',
  },
  {
    name: 'Liberian Dollar',
    code: 'LRD',
  },
  {
    name: 'Libyan Dinar',
    code: 'LYD',
  },
  {
    name: 'Swiss Franc',
    code: 'CHF',
  },
  {
    name: 'Pataca',
    code: 'MOP',
  },
  {
    name: 'Denar',
    code: 'MKD',
  },
  {
    name: 'Malagasy Ariary',
    code: 'MGA',
  },
  {
    name: 'Kwacha',
    code: 'MWK',
  },
  {
    name: 'Malaysian Ringgit',
    code: 'MYR',
  },
  {
    name: 'Rufiyaa',
    code: 'MVR',
  },
  {
    name: 'Ouguiya',
    code: 'MRO',
  },
  {
    name: 'Mauritius Rupee',
    code: 'MUR',
  },
  {
    name: 'Mexican Peso',
    code: 'MXN',
  },
  {
    name: 'Moldovan Leu',
    code: 'MDL',
  },
  {
    name: 'Tugrik',
    code: 'MNT',
  },
  {
    name: 'Moroccan Dirham',
    code: 'MAD',
  },
  {
    name: 'Mozambique Metical',
    code: 'MZN',
  },
  {
    name: 'Kyat',
    code: 'MMK',
  },
  {
    name: 'Namibia Dollar',
    code: 'NAD',
  },
  {
    name: 'Nepalese Rupee',
    code: 'NPR',
  },
  {
    name: 'Cordoba Oro',
    code: 'NIO',
  },
  {
    name: 'Naira',
    code: 'NGN',
  },
  {
    name: 'Rial Omani',
    code: 'OMR',
  },
  {
    name: 'Pakistan Rupee',
    code: 'PKR',
  },
  {
    name: 'Balboa',
    code: 'PAB',
  },
  {
    name: 'Kina',
    code: 'PGK',
  },
  {
    name: 'Guarani',
    code: 'PYG',
  },
  {
    name: 'Nuevo Sol',
    code: 'PEN',
  },
  {
    name: 'Philippine Peso',
    code: 'PHP',
  },
  {
    name: 'Zloty',
    code: 'PLN',
  },
  {
    name: 'Qatari Rial',
    code: 'QAR',
  },
  {
    name: 'Romanian Leu',
    code: 'RON',
  },
  {
    name: 'Russian Ruble',
    code: 'RUB',
  },
  {
    name: 'Rwanda Franc',
    code: 'RWF',
  },
  {
    name: 'Saint Helena Pound',
    code: 'SHP',
  },
  {
    name: 'Tala',
    code: 'WST',
  },
  {
    name: 'Dobra',
    code: 'STD',
  },
  {
    name: 'Saudi Riyal',
    code: 'SAR',
  },
  {
    name: 'Serbian Dinar',
    code: 'RSD',
  },
  {
    name: 'Seychelles Rupee',
    code: 'SCR',
  },
  {
    name: 'Leone',
    code: 'SLL',
  },
  {
    name: 'Singapore Dollar',
    code: 'SGD',
  },
  {
    name: 'Sucre',
    code: 'XSU',
  },
  {
    name: 'Solomon Islands Dollar',
    code: 'SBD',
  },
  {
    name: 'Somali Shilling',
    code: 'SOS',
  },
  {
    name: 'Rand',
    code: 'ZAR',
  },
  {
    name: 'South Sudanese Pound',
    code: 'SSP',
  },
  {
    name: 'Sri Lanka Rupee',
    code: 'LKR',
  },
  {
    name: 'Sudanese Pound',
    code: 'SDG',
  },
  {
    name: 'Surinam Dollar',
    code: 'SRD',
  },
  {
    name: 'Lilangeni',
    code: 'SZL',
  },
  {
    name: 'Swedish Krona',
    code: 'SEK',
  },
  {
    name: 'Syrian Pound',
    code: 'SYP',
  },
  {
    name: 'New Taiwan Dollar',
    code: 'TWD',
  },
  {
    name: 'Somoni',
    code: 'TJS',
  },
  {
    name: 'Tanzanian Shilling',
    code: 'TZS',
  },
  {
    name: 'Baht',
    code: 'THB',
  },
  {
    name: 'Pa\'anga',
    code: 'TOP',
  },
  {
    name: 'Trinidad and Tobago Dollar',
    code: 'TTD',
  },
  {
    name: 'Tunisian Dinar',
    code: 'TND',
  },
  {
    name: 'Turkish Lira',
    code: 'TRY',
  },
  {
    name: 'Turkmenistan New Manat',
    code: 'TMT',
  },
  {
    name: 'Uganda Shilling',
    code: 'UGX',
  },
  {
    name: 'Hryvnia',
    code: 'UAH',
  },
  {
    name: 'UAE Dirham',
    code: 'AED',
  },
  {
    name: 'Peso Uruguayo',
    code: 'UYU',
  },
  {
    name: 'Uzbekistan Sum',
    code: 'UZS',
  },
  {
    name: 'Vatu',
    code: 'VUV',
  },
  {
    name: 'Bolivar',
    code: 'VEF',
  },
  {
    name: 'Dong',
    code: 'VND',
  },
  {
    name: 'Yemeni Rial',
    code: 'YER',
  },
  {
    name: 'Zambian Kwacha',
    code: 'ZMW',
  },
  {
    name: 'Zimbabwe Dollar',
    code: 'ZWL',
  },
];

export default currencies;

let _indexedCurrencies;

function getIndexedCurrencies() {
  if (_indexedCurrencies) return _indexedCurrencies;

  _indexedCurrencies = currencies.reduce((indexedObj, currency) => {
    indexedObj[currency.code] = _.omit(currency, 'code');
    return indexedObj;
  }, {});

  return _indexedCurrencies;
}

export function getCurrencyByCode(code, options = {}) {
  const opts = {
    includeWalletCurs: true,
    ...options,
  };

  if (!code) {
    throw new Error('Please provide a currency code.');
  }

  const currency = getIndexedCurrencies()[code];

  if (!currency && opts.includeWalletCurs) {
    return getCryptoCurByCode(code);
  }

  return currency;
}

function getCurrencies(options = {}) {
  const opts = {
    sortBy: 'name',
    includeWalletCurs: true,
    lang: app && app.localSettings && app.localSettings.standardizedTranslatedLang() ||
      'en-US',
    ...options,
  };

  if (typeof opts.sortBy !== 'string' && opts.sortyBy !== false) {
    throw new Error('The sortBy option must be provided as a string or false.');
  }

  if (typeof opts.lang !== 'string') {
    throw new Error('The lang option must be a string.');
  }

  const walletCurs = (opts.includeWalletCurs ? supportedWalletCurs() : [])
    .map(cur => {
      const name = app.polyglot.t(`cryptoCurrencies.${cur}`, { _: cur });

      return {
        ...(getCryptoCurByCode(cur)),
        code: ensureMainnetCode(cur),
        name,
        nameWithCode: app.polyglot.t('currencyWithCode', {
          name,
          code: ensureMainnetCode(cur),
        }),
      };
    });

  const fiatCurs = currencies
    .map(cur => {
      const name = app.polyglot.t(`currencies.${cur.code}`, { _: cur.code });

      return {
        ...cur,
        name,
        nameWithCode: app.polyglot.t('currencyWithCode', {
          name,
          code: cur.code,
        }),
      };
    });

  const curs = [
    ...walletCurs,
    ...fiatCurs,
  ];

  if (opts.sortBy) {
    curs.sort((a, b) => a[opts.sortBy].localeCompare(b[opts.sortBy], opts.lang));
  }

  return curs;
}

const memoizedGetCurrencies =
  _.memoize(getCurrencies, opts => `${JSON.stringify(opts)}`);

export { memoizedGetCurrencies as getCurrencies };

export function getCurrenciesSortedByCode(options = {}) {
  return getCurrencies({
    ...options,
    sortBy: 'code',
  });
}
