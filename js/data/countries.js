import _ from 'underscore';
import app from '../app';

const countries = [
  {
    name: 'Afghanistan',
    dataName: 'AFGHANISTAN',
    currency: 'AFN',
    number: '971',
  },
  {
    name: 'Åland Islands',
    dataName: 'ALAND_ISLANDS',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Albania',
    dataName: 'ALBANIA',
    currency: 'ALL',
    number: '008',
  },
  {
    name: 'Algeria',
    dataName: 'ALGERIA',
    currency: 'DZD',
    number: '012',
  },
  {
    name: 'American Samoa',
    dataName: 'AMERICAN_SAMOA',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Andorra',
    dataName: 'ANDORRA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Angola',
    dataName: 'ANGOLA',
    currency: 'AOA',
    number: '973',
  },
  {
    name: 'Anguilla',
    dataName: 'ANGUILLA',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Antigua and Barbuda',
    dataName: 'ANTIGUA',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Argentina',
    dataName: 'ARGENTINA',
    currency: 'ARS',
    number: '032',
  },
  {
    name: 'Armenia',
    dataName: 'ARMENIA',
    currency: 'AMD',
    number: '051',
  },
  {
    name: 'Aruba',
    dataName: 'ARUBA',
    currency: 'AWG',
    number: '533',
  },
  {
    name: 'Australia',
    dataName: 'AUSTRALIA',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Austria',
    dataName: 'AUSTRIA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Azerbaijan',
    dataName: 'AZERBAIJAN',
    currency: 'AZN',
    number: '944',
  },
  {
    name: 'Bahamas (The)',
    dataName: 'BAHAMAS',
    currency: 'BSD',
    number: '044',
  },
  {
    name: 'Bahrain',
    dataName: 'BAHRAIN',
    currency: 'BHD',
    number: '048',
  },
  {
    name: 'Bangladesh',
    dataName: 'BANGLADESH',
    currency: 'BDT',
    number: '050',
  },
  {
    name: 'Barbados',
    dataName: 'BARBADOS',
    currency: 'BBD',
    number: '052',
  },
  {
    name: 'Belarus',
    dataName: 'BELARUS',
    currency: 'BYR',
    number: '974',
  },
  {
    name: 'Belgium',
    dataName: 'BELGIUM',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Belize',
    dataName: 'BELIZE',
    currency: 'BZD',
    number: '084',
  },
  {
    name: 'Benin',
    dataName: 'BENIN',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Bermuda',
    dataName: 'BERMUDA',
    currency: 'BMD',
    number: '060',
  },
  {
    name: 'Bhutan',
    dataName: 'BHUTAN',
    currency: 'BTN',
    number: '064',
  },
  {
    name: 'Bolivia (Plurinational State of)',
    dataName: 'BOLIVIA',
    currency: 'BOB',
    number: '068',
  },
  {
    name: 'Bonaire, Sint Eustatius and Saba',
    dataName: 'BONAIRE_SINT_EUSTATIUS_SABA',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Bosnia and Herzegovina',
    dataName: 'BOSNIA',
    currency: 'BAM',
    number: '977',
  },
  {
    name: 'Botswana',
    dataName: 'BOTSWANA',
    currency: 'BWP',
    number: '072',
  },
  {
    name: 'Bouvet Island',
    dataName: 'BOUVET_ISLAND',
    currency: 'NOK',
    number: '578',
  },
  {
    name: 'Brazil',
    dataName: 'BRAZIL',
    currency: 'BRL',
    number: '986',
  },
  {
    name: 'British Indian Ocean Territory (The)',
    dataName: 'BRITISH_INDIAN_OCEAN_TERRITORY',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Brunei Darussalam',
    dataName: 'BRUNEI_DARUSSALAM',
    currency: 'BND',
    number: '096',
  },
  {
    name: 'Bulgaria',
    dataName: 'BULGARIA',
    currency: 'BGN',
    number: '975',
  },
  {
    name: 'Burkina Faso',
    dataName: 'BURKINA_FASO',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Burundi',
    dataName: 'BURUNDI',
    currency: 'BIF',
    number: '108',
  },
  {
    name: 'Cabo Verde',
    dataName: 'CABO_VERDE',
    currency: 'CVE',
    number: '132',
  },
  {
    name: 'Cambodia',
    dataName: 'CAMBODIA',
    currency: 'KHR',
    number: '116',
  },
  {
    name: 'Cameroon',
    dataName: 'CAMEROON',
    currency: 'XAF',
    number: '950',
  },
  {
    name: 'Canada',
    dataName: 'CANADA',
    currency: 'CAD',
    number: '124',
  },
  {
    name: 'Cayman Islands (The)',
    dataName: 'CAYMAN_ISLANDS',
    currency: 'KYD',
    number: '136',
  },
  {
    name: 'Central African Republic (The)',
    dataName: 'CENTRAL_AFRICAN_REPUBLIC',
    currency: 'XAF',
    number: '950',
  },
  {
    name: 'Chad',
    dataName: 'CHAD',
    currency: 'XAF',
    number: '950',
  },
  {
    name: 'Chile',
    dataName: 'CHILE',
    currency: 'CLP',
    number: '152',
  },
  {
    name: 'China',
    dataName: 'CHINA',
    currency: 'CNY',
    number: '156',
  },
  {
    name: 'Christmas Island',
    dataName: 'CHRISTMAS_ISLAND',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Cocos (KEELING) Islands (The)',
    dataName: 'COCOS_ISLANDS',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Colombia',
    dataName: 'COLOMBIA',
    currency: 'COP',
    number: '170',
  },
  {
    name: 'Comoros (The)',
    dataName: 'COMOROS',
    currency: 'KMF',
    number: '174',
  },
  {
    name: 'Congo (The Democratic Republic of the)',
    dataName: 'CONGO_REPUBLIC',
    currency: 'CDF',
    number: '976',
  },
  {
    name: 'Congo (The)',
    dataName: 'CONGO',
    currency: 'XAF',
    number: '950',
  },
  {
    name: 'Cook Islands (The)',
    dataName: 'COOK_ISLANDS',
    currency: 'NZD',
    number: '554',
  },
  {
    name: 'Costa Rica',
    dataName: 'COSTA_RICA',
    currency: 'CRC',
    number: '188',
  },
  {
    name: 'Côte D\'Ivoire',
    dataName: 'COTE_DIVOIRE',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Croatia',
    dataName: 'CROATIA',
    currency: 'HRK',
    number: '191',
  },
  {
    name: 'Cuba',
    dataName: 'CUBA',
    currency: 'CUP',
    number: '192',
  },
  {
    name: 'Curaçao',
    dataName: 'CURACAO',
    currency: 'ANG',
    number: '532',
  },
  {
    name: 'Cyprus',
    dataName: 'CYPRUS',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Czech Republic (The)',
    dataName: 'CZECH_REPUBLIC',
    currency: 'CZK',
    number: '203',
  },
  {
    name: 'Denmark',
    dataName: 'DENMARK',
    currency: 'DKK',
    number: '208',
  },
  {
    name: 'Djibouti',
    dataName: 'DJIBOUTI',
    currency: 'DJF',
    number: '262',
  },
  {
    name: 'Dominica',
    dataName: 'DOMINICA',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Dominican Republic (The)',
    dataName: 'DOMINICAN_REPUBLIC',
    currency: 'DOP',
    number: '214',
  },
  {
    name: 'Ecuador',
    dataName: 'ECUADOR',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Egypt',
    dataName: 'EGYPT',
    currency: 'EGP',
    number: '818',
  },
  {
    name: 'El Salvador',
    dataName: 'EL_SALVADOR',
    currency: 'SVC',
    number: '222',
  },
  {
    name: 'Equatorial Guinea',
    dataName: 'EQUATORIAL_GUINEA',
    currency: 'XAF',
    number: '950',
  },
  {
    name: 'Eritrea',
    dataName: 'ERITREA',
    currency: 'ERN',
    number: '232',
  },
  {
    name: 'Estonia',
    dataName: 'ESTONIA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Eswatini',
    dataName: 'ESWATINI',
    currency: 'SZL',
    number: '748',
  },
  {
    name: 'Ethiopia',
    dataName: 'ETHIOPIA',
    currency: 'ETB',
    number: '230',
  },
  {
    name: 'Falkland Islands (The)',
    dataName: 'FALKLAND_ISLANDS',
    currency: 'FKP',
    number: '238',
  },
  {
    name: 'Faroe Islands (The)',
    dataName: 'FAROE_ISLANDS',
    currency: 'DKK',
    number: '208',
  },
  {
    name: 'Fiji',
    dataName: 'FIJI',
    currency: 'FJD',
    number: '242',
  },
  {
    name: 'Finland',
    dataName: 'FINLAND',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'France',
    dataName: 'FRANCE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'French Guiana',
    dataName: 'FRENCH_GUIANA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'French Polynesia',
    dataName: 'FRENCH_POLYNESIA',
    currency: 'XPF',
    number: '953',
  },
  {
    name: 'French Southern Territories (The)',
    dataName: 'FRENCH_SOUTHERN_TERRITORIES',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Gabon',
    dataName: 'GABON',
    currency: 'XAF',
    number: '950',
  },
  {
    name: 'Gambia (The)',
    dataName: 'GAMBIA',
    currency: 'GMD',
    number: '270',
  },
  {
    name: 'Georgia',
    dataName: 'GEORGIA',
    currency: 'GEL',
    number: '981',
  },
  {
    name: 'Germany',
    dataName: 'GERMANY',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Ghana',
    dataName: 'GHANA',
    currency: 'GHS',
    number: '936',
  },
  {
    name: 'Gibraltar',
    dataName: 'GIBRALTAR',
    currency: 'GIP',
    number: '292',
  },
  {
    name: 'Greece',
    dataName: 'GREECE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Greenland',
    dataName: 'GREENLAND',
    currency: 'DKK',
    number: '208',
  },
  {
    name: 'Grenada',
    dataName: 'GRENADA',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Guadeloupe',
    dataName: 'GUADELOUPE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Guam',
    dataName: 'GUAM',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Guatemala',
    dataName: 'GUATEMALA',
    currency: 'GTQ',
    number: '320',
  },
  {
    name: 'Guernsey',
    dataName: 'GUERNSEY',
    currency: 'GBP',
    number: '826',
  },
  {
    name: 'Guinea',
    dataName: 'GUINEA',
    currency: 'GNF',
    number: '324',
  },
  {
    name: 'Guinea-Bissau',
    dataName: 'GUINEA_BISSAU',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Guyana',
    dataName: 'GUYANA',
    currency: 'GYD',
    number: '328',
  },
  {
    name: 'Haiti',
    dataName: 'HAITI',
    currency: 'HTG',
    number: '332',
  },
  {
    name: 'Heard Island and McDonald Islands',
    dataName: 'HEARD_ISLAND',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Holy See (The)',
    dataName: 'HOLY_SEE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Honduras',
    dataName: 'HONDURAS',
    currency: 'HNL',
    number: '340',
  },
  {
    name: 'Hong Kong',
    dataName: 'HONG_KONG',
    currency: 'HKD',
    number: '344',
  },
  {
    name: 'Hungary',
    dataName: 'HUNGARY',
    currency: 'HUF',
    number: '348',
  },
  {
    name: 'Iceland',
    dataName: 'ICELAND',
    currency: 'ISK',
    number: '352',
  },
  {
    name: 'India',
    dataName: 'INDIA',
    currency: 'INR',
    number: '356',
  },
  {
    name: 'Indonesia',
    dataName: 'INDONESIA',
    currency: 'IDR',
    number: '360',
  },
  {
    name: 'Iran (Islamic Republic of)',
    dataName: 'IRAN',
    currency: 'IRR',
    number: '364',
  },
  {
    name: 'Iraq',
    dataName: 'IRAQ',
    currency: 'IQD',
    number: '368',
  },
  {
    name: 'Ireland',
    dataName: 'IRELAND',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Isle of Man',
    dataName: 'ISLE_OF_MAN',
    currency: 'GBP',
    number: '826',
  },
  {
    name: 'Israel',
    dataName: 'ISRAEL',
    currency: 'ILS',
    number: '376',
  },
  {
    name: 'Italy',
    dataName: 'ITALY',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Jamaica',
    dataName: 'JAMAICA',
    currency: 'JMD',
    number: '388',
  },
  {
    name: 'Japan',
    dataName: 'JAPAN',
    currency: 'JPY',
    number: '392',
  },
  {
    name: 'Jersey',
    dataName: 'JERSEY',
    currency: 'GBP',
    number: '826',
  },
  {
    name: 'Jordan',
    dataName: 'JORDAN',
    currency: 'JOD',
    number: '400',
  },
  {
    name: 'Kazakhstan',
    dataName: 'KAZAKHSTAN',
    currency: 'KZT',
    number: '398',
  },
  {
    name: 'Kenya',
    dataName: 'KENYA',
    currency: 'KES',
    number: '404',
  },
  {
    name: 'Kiribati',
    dataName: 'KIRIBATI',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Korea (The Democratic People\'s Republic of)',
    dataName: 'NORTH_KOREA',
    currency: 'KPW',
    number: '408',
  },
  {
    name: 'Korea (The Republic of)',
    dataName: 'SOUTH_KOREA',
    currency: 'KRW',
    number: '410',
  },
  {
    name: 'Kuwait',
    dataName: 'KUWAIT',
    currency: 'KWD',
    number: '414',
  },
  {
    name: 'Kyrgyzstan',
    dataName: 'KYRGYZSTAN',
    currency: 'KGS',
    number: '417',
  },
  {
    name: 'Lao People\'s Democratic Republic (The)',
    dataName: 'LAO',
    currency: 'LAK',
    number: '418',
  },
  {
    name: 'Latvia',
    dataName: 'LATVIA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Lebanon',
    dataName: 'LEBANON',
    currency: 'LBP',
    number: '422',
  },
  {
    name: 'Lesotho',
    dataName: 'LESOTHO',
    currency: 'LSL',
    number: '426',
  },
  {
    name: 'Liberia',
    dataName: 'LIBERIA',
    currency: 'LRD',
    number: '430',
  },
  {
    name: 'Libya',
    dataName: 'LIBYA',
    currency: 'LYD',
    number: '434',
  },
  {
    name: 'Liechtenstein',
    dataName: 'LIECHTENSTEIN',
    currency: 'CHF',
    number: '756',
  },
  {
    name: 'Lithuania',
    dataName: 'LITHUANIA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Luxembourg',
    dataName: 'LUXEMBOURG',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Macao',
    dataName: 'MACAO',
    currency: 'MOP',
    number: '446',
  },
  {
    name: 'Macedonia (The Former Yugoslav Republic of)',
    dataName: 'MACEDONIA',
    currency: 'MKD',
    number: '807',
  },
  {
    name: 'Madagascar',
    dataName: 'MADAGASCAR',
    currency: 'MGA',
    number: '969',
  },
  {
    name: 'Malawi',
    dataName: 'MALAWI',
    currency: 'MWK',
    number: '454',
  },
  {
    name: 'Malaysia',
    dataName: 'MALAYSIA',
    currency: 'MYR',
    number: '458',
  },
  {
    name: 'Maldives',
    dataName: 'MALDIVES',
    currency: 'MVR',
    number: '462',
  },
  {
    name: 'Mali',
    dataName: 'MALI',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Malta',
    dataName: 'MALTA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Marshall Islands (The)',
    dataName: 'MARSHALL_ISLANDS',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Martinique',
    dataName: 'MARTINIQUE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Mauritania',
    dataName: 'MAURITANIA',
    currency: 'MRO',
    number: '478',
  },
  {
    name: 'Mauritius',
    dataName: 'MAURITIUS',
    currency: 'MUR',
    number: '480',
  },
  {
    name: 'Mayotte',
    dataName: 'MAYOTTE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Mexico',
    dataName: 'MEXICO',
    currency: 'MXN',
    number: '484',
  },
  {
    name: 'Micronesia (Federated States of)',
    dataName: 'MICRONESIA',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Moldova (The Republic of)',
    dataName: 'MOLDOVA',
    currency: 'MDL',
    number: '498',
  },
  {
    name: 'Monaco',
    dataName: 'MONACO',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Mongolia',
    dataName: 'MONGOLIA',
    currency: 'MNT',
    number: '496',
  },
  {
    name: 'Montenegro',
    dataName: 'MONTENEGRO',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Montserrat',
    dataName: 'MONTSERRAT',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Morocco',
    dataName: 'MOROCCO',
    currency: 'MAD',
    number: '504',
  },
  {
    name: 'Mozambique',
    dataName: 'MOZAMBIQUE',
    currency: 'MZN',
    number: '943',
  },
  {
    name: 'Myanmar',
    dataName: 'MYANMAR',
    currency: 'MMK',
    number: '104',
  },
  {
    name: 'Namibia',
    dataName: 'NAMIBIA',
    currency: 'NAD',
    number: '516',
  },
  {
    name: 'Nauru',
    dataName: 'NAURU',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Nepal',
    dataName: 'NEPAL',
    currency: 'NPR',
    number: '524',
  },
  {
    name: 'Netherlands (The)',
    dataName: 'NETHERLANDS',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'New Caledonia',
    dataName: 'NEW_CALEDONIA',
    currency: 'XPF',
    number: '953',
  },
  {
    name: 'New Zealand',
    dataName: 'NEW_ZEALAND',
    currency: 'NZD',
    number: '554',
  },
  {
    name: 'Nicaragua',
    dataName: 'NICARAGUA',
    currency: 'NIO',
    number: '558',
  },
  {
    name: 'Niger (The)',
    dataName: 'NIGER',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Nigeria',
    dataName: 'NIGERIA',
    currency: 'NGN',
    number: '566',
  },
  {
    name: 'Niue',
    dataName: 'NIUE',
    currency: 'NZD',
    number: '554',
  },
  {
    name: 'Norfolk Island',
    dataName: 'NORFOLK_ISLAND',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Northern Mariana Islands (The)',
    dataName: 'NORTHERN_MARIANA_ISLANDS',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Norway',
    dataName: 'NORWAY',
    currency: 'NOK',
    number: '578',
  },
  {
    name: 'Oman',
    dataName: 'OMAN',
    currency: 'OMR',
    number: '512',
  },
  {
    name: 'Pakistan',
    dataName: 'PAKISTAN',
    currency: 'PKR',
    number: '586',
  },
  {
    name: 'Palau',
    dataName: 'PALAU',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Panama',
    dataName: 'PANAMA',
    currency: 'PAB',
    number: '590',
  },
  {
    name: 'Papua New Guinea',
    dataName: 'PAPUA_NEW_GUINEA',
    currency: 'PGK',
    number: '598',
  },
  {
    name: 'Paraguay',
    dataName: 'PARAGUAY',
    currency: 'PYG',
    number: '600',
  },
  {
    name: 'Peru',
    dataName: 'PERU',
    currency: 'PEN',
    number: '604',
  },
  {
    name: 'Philippines (The)',
    dataName: 'PHILIPPINES',
    currency: 'PHP',
    number: '608',
  },
  {
    name: 'Pitcairn',
    dataName: 'PITCAIRN',
    currency: 'NZD',
    number: '554',
  },
  {
    name: 'Poland',
    dataName: 'POLAND',
    currency: 'PLN',
    number: '985',
  },
  {
    name: 'Portugal',
    dataName: 'PORTUGAL',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Puerto Rico',
    dataName: 'PUERTO_RICO',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Qatar',
    dataName: 'QATAR',
    currency: 'QAR',
    number: '634',
  },
  {
    name: 'Réunion',
    dataName: 'REUNION',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Romania',
    dataName: 'ROMANIA',
    currency: 'RON',
    number: '946',
  },
  {
    name: 'Russian Federation (The)',
    dataName: 'RUSSIA',
    currency: 'RUB',
    number: '643',
  },
  {
    name: 'Rwanda',
    dataName: 'RWANDA',
    currency: 'RWF',
    number: '646',
  },
  {
    name: 'Saint Barthélemy',
    dataName: 'SAINT_BARTHELEMY',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Saint Helena, Ascension and Tristan da Cunha',
    dataName: 'SAINT_HELENA',
    currency: 'SHP',
    number: '654',
  },
  {
    name: 'Saint Kitts and Nevis',
    dataName: 'SAINT_KITTS',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Saint Lucia',
    dataName: 'SAINT_LUCIA',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Saint Martin (French Part)',
    dataName: 'SAINT_MARTIN',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Saint Pierre and Miquelon',
    dataName: 'SAINT_PIERRE',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Saint Vincent and The Grenadines',
    dataName: 'SAINT_VINCENT',
    currency: 'XCD',
    number: '951',
  },
  {
    name: 'Samoa',
    dataName: 'SAMOA',
    currency: 'WST',
    number: '882',
  },
  {
    name: 'San Marino',
    dataName: 'SAN_MARINO',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Sao Tome and Principe',
    dataName: 'SAO_TOME',
    currency: 'STD',
    number: '678',
  },
  {
    name: 'Saudi Arabia',
    dataName: 'SAUDI_ARABIA',
    currency: 'SAR',
    number: '682',
  },
  {
    name: 'Senegal',
    dataName: 'SENEGAL',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Serbia',
    dataName: 'SERBIA',
    currency: 'RSD',
    number: '941',
  },
  {
    name: 'Seychelles',
    dataName: 'SEYCHELLES',
    currency: 'SCR',
    number: '690',
  },
  {
    name: 'Sierra Leone',
    dataName: 'SIERRA_LEONE',
    currency: 'SLL',
    number: '694',
  },
  {
    name: 'Singapore',
    dataName: 'SINGAPORE',
    currency: 'SGD',
    number: '702',
  },
  {
    name: 'Sint Maarten (Dutch Part)',
    dataName: 'SINT_MAARTEN',
    currency: 'ANG',
    number: '532',
  },
  {
    name: 'Sistema Unitario de Compensacion Regional de Pagos \'Sucre',
    dataName: 'SUCRE',
    currency: 'XSU',
    number: '994',
  },
  {
    name: 'Slovakia',
    dataName: 'SLOVAKIA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Slovenia',
    dataName: 'SLOVENIA',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Solomon Islands',
    dataName: 'SOLOMON_ISLANDS',
    currency: 'SBD',
    number: '090',
  },
  {
    name: 'Somalia',
    dataName: 'SOMALIA',
    currency: 'SOS',
    number: '706',
  },
  {
    name: 'South Africa',
    dataName: 'SOUTH_AFRICA',
    currency: 'ZAR',
    number: '710',
  },
  {
    name: 'South Sudan',
    dataName: 'SOUTH_SUDAN',
    currency: 'SSP',
    number: '728',
  },
  {
    name: 'Spain',
    dataName: 'SPAIN',
    currency: 'EUR',
    number: '978',
  },
  {
    name: 'Sri Lanka',
    dataName: 'SRI_LANKA',
    currency: 'LKR',
    number: '144',
  },
  {
    name: 'Sudan (The)',
    dataName: 'SUDAN',
    currency: 'SDG',
    number: '938',
  },
  {
    name: 'Suriname',
    dataName: 'SURINAME',
    currency: 'SRD',
    number: '968',
  },
  {
    name: 'Svalbard and Jan Mayen',
    dataName: 'SVALBARD',
    currency: 'NOK',
    number: '578',
  },
  {
    name: 'Sweden',
    dataName: 'SWEDEN',
    currency: 'SEK',
    number: '752',
  },
  {
    name: 'Switzerland',
    dataName: 'SWITZERLAND',
    currency: 'CHF',
    number: '756',
  },
  {
    name: 'Syrian Arab Republic',
    dataName: 'SYRIAN_ARAB_REPUBLIC',
    currency: 'SYP',
    number: '760',
  },
  {
    name: 'Taiwan',
    dataName: 'TAIWAN',
    currency: 'TWD',
    number: '901',
  },
  {
    name: 'Tajikistan',
    dataName: 'TAJIKISTAN',
    currency: 'TJS',
    number: '972',
  },
  {
    name: 'Tanzania, United Republic of',
    dataName: 'TANZANIA',
    currency: 'TZS',
    number: '834',
  },
  {
    name: 'Thailand',
    dataName: 'THAILAND',
    currency: 'THB',
    number: '764',
  },
  {
    name: 'Timor-Leste',
    dataName: 'TIMOR_LESTE',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Togo',
    dataName: 'TOGO',
    currency: 'XOF',
    number: '952',
  },
  {
    name: 'Tokelau',
    dataName: 'TOKELAU',
    currency: 'NZD',
    number: '554',
  },
  {
    name: 'Tonga',
    dataName: 'TONGA',
    currency: 'TOP',
    number: '776',
  },
  {
    name: 'Trinidad and Tobago',
    dataName: 'TRINIDAD',
    currency: 'TTD',
    number: '780',
  },
  {
    name: 'Tunisia',
    dataName: 'TUNISIA',
    currency: 'TND',
    number: '788',
  },
  {
    name: 'Turkey',
    dataName: 'TURKEY',
    currency: 'TRY',
    number: '949',
  },
  {
    name: 'Turkmenistan',
    dataName: 'TURKMENISTAN',
    currency: 'TMT',
    number: '934',
  },
  {
    name: 'Turks and Caicos Islands (The)',
    dataName: 'TURKS_AND_CAICOS_ISLANDS',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Tuvalu',
    dataName: 'TUVALU',
    currency: 'AUD',
    number: '036',
  },
  {
    name: 'Uganda',
    dataName: 'UGANDA',
    currency: 'UGX',
    number: '800',
  },
  {
    name: 'Ukraine',
    dataName: 'UKRAINE',
    currency: 'UAH',
    number: '980',
  },
  {
    name: 'United Arab Emirates (The)',
    dataName: 'UNITED_ARAB_EMIRATES',
    currency: 'AED',
    number: '784',
  },
  {
    name: 'United Kingdom of Great Britain and Northern Ireland (The)',
    dataName: 'UNITED_KINGDOM',
    currency: 'GBP',
    number: '826',
  },
  {
    name: 'United States of America (The)',
    dataName: 'UNITED_STATES',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'United States Minor Outlying Islands',
    dataName: 'UNITED_STATES_MINOR_ISLANDS',
    currency: 'USD',
    number: '581',
  },
  {
    name: 'Uruguay',
    dataName: 'URUGUAY',
    currency: 'UYU',
    number: '858',
  },
  {
    name: 'Uzbekistan',
    dataName: 'UZBEKISTAN',
    currency: 'UZS',
    number: '860',
  },
  {
    name: 'Vanuatu',
    dataName: 'VANUATU',
    currency: 'VUV',
    number: '548',
  },
  {
    name: 'Venezuela (Bolivarian Republic Of)',
    dataName: 'VENEZUELA',
    currency: 'VEF',
    number: '937',
  },
  {
    name: 'Việt Nam',
    dataName: 'VIETNAM',
    currency: 'VND',
    number: '704',
  },
  {
    name: 'Virgin Islands (British)',
    dataName: 'VIRGIN_ISLANDS_BRITISH',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Virgin Islands (U.S.)',
    dataName: 'VIRGIN_ISLANDS_US',
    currency: 'USD',
    number: '840',
  },
  {
    name: 'Wallis and Futuna',
    dataName: 'WALLIS_AND_FUTUNA',
    currency: 'XPF',
    number: '953',
  },
  {
    name: 'Western Sahara',
    dataName: 'WESTERN_SAHARA',
    currency: 'MAD',
    number: '504',
  },
  {
    name: 'Yemen',
    dataName: 'YEMEN',
    currency: 'YER',
    number: '886',
  },
  {
    name: 'Zambia',
    dataName: 'ZAMBIA',
    currency: 'ZMW',
    number: '967',
  },
  {
    name: 'Zimbabwe',
    dataName: 'ZIMBABWE',
    currency: 'ZWL',
    number: '932',
  },
];

export default countries;

let indexedCountries;

export function getIndexedCountries() {
  if (indexedCountries) return indexedCountries;

  indexedCountries = countries.reduce((indexedObj, country) => {
    indexedObj[country.dataName] = _.omit(country, 'dataName');
    return indexedObj;
  }, {});

  return indexedCountries;
}

export function getCountryByDataName(dataName) {
  if (!dataName) {
    throw new Error('Please provide a dataName.');
  }

  return {
    ...getIndexedCountries()[dataName],
    translatedName: app.polyglot.t(`countries.${dataName}`),
  };
}

function getTranslatedCountries(lang = app.localSettings.standardizedTranslatedLang(),
  sort = true) {
  if (!lang) {
    throw new Error('Please provide the language the translated countries' +
      ' should be returned in.');
  }

  let translated = countries.map((country) => ({
    ...country,
    name: app.polyglot.t(`countries.${country.dataName}`),
  }));

  if (sort) {
    translated = translated.sort((a, b) => {
      let localizedCompare;

      try {
        localizedCompare = a.name.localeCompare(b.name,
          app.localSettings.standardizedTranslatedLang(lang));
      } catch (e) {
        let returnVal = 0;

        if (a > b) {
          returnVal = -1;
        } else if (a > b) {
          returnVal = 1;
        }

        return returnVal;
      }

      return localizedCompare;
    });
  }

  return translated;
}

const memoizedGetTranslatedCountries =
  _.memoize(getTranslatedCountries, (lang, sort) => `${lang}-${!!sort}`);

export { memoizedGetTranslatedCountries as getTranslatedCountries };
