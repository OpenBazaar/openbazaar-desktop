import _ from 'underscore';

const languages = [
  {
    name: 'Abkhaz',
    code: 'ab',
  },
  {
    name: 'Acoli',
    code: 'ach',
  },
  {
    name: 'Adyghe',
    code: 'ady',
  },
  {
    name: 'Afrikaans',
    code: 'af',
  },
  {
    name: 'Akan',
    code: 'ak',
  },
  {
    name: 'Albanian',
    code: 'sq',
  },
  {
    name: 'Albanian Gheg',
    code: 'aln',
  },
  {
    name: 'Amharic',
    code: 'am',
  },
  {
    name: 'Arabic',
    code: 'ar',
  },
  {
    name: 'Aragonese',
    code: 'an',
  },
  {
    name: 'Armenian',
    code: 'hy',
  },
  {
    name: 'Assamese',
    code: 'as',
  },
  {
    name: 'Asturian',
    code: 'ast',
  },
  {
    name: 'Azerbaijani',
    code: 'az',
  },
  {
    name: 'Balochi',
    code: 'bal',
  },
  {
    name: 'Bashkir',
    code: 'ba',
  },
  {
    name: 'Basque',
    code: 'eu',
  },
  {
    name: 'Bavarian',
    code: 'bar',
  },
  {
    name: 'Belarusian',
    code: 'be',
  },
  {
    name: 'Bengali',
    code: 'bn',
  },
  {
    name: 'Bodo',
    code: 'brx',
  },
  {
    name: 'Bosnian',
    code: 'bs',
  },
  {
    name: 'Breton',
    code: 'br',
  },
  {
    name: 'Bulgarian',
    code: 'bg',
  },
  {
    name: 'Burmese',
    code: 'my',
  },
  {
    name: 'Catalan',
    code: 'ca',
  },
  {
    name: 'Cebuano',
    code: 'ceb',
  },
  {
    name: 'Central Atlas Tamazight',
    code: 'tzm',
  },
  {
    name: 'Central Kurdish',
    code: 'ckb',
  },
  {
    name: 'Cherokee',
    code: 'chr',
  },
  {
    name: 'Chhattisgarhi',
    code: 'hne',
  },
  {
    name: 'Chiga',
    code: 'cgg',
  },
  {
    name: 'Chinese',
    code: 'zh',
  },
  {
    name: 'Chinese (Gan)',
    code: 'gan',
  },
  {
    name: 'Chinese (Hakka)',
    code: 'hak',
  },
  {
    name: 'Chinese (Huizhou)',
    code: 'czh',
  },
  {
    name: 'Chinese (Jinyu)',
    code: 'cjy',
  },
  {
    name: 'Chinese (Literary)',
    code: 'lzh',
  },
  {
    name: 'Chinese (Mandarin)',
    code: 'cmn',
  },
  {
    name: 'Chinese (Min Bei)',
    code: 'mnp',
  },
  {
    name: 'Chinese (Min Dong)',
    code: 'cdo',
  },
  {
    name: 'Chinese (Min Nan)',
    code: 'nan',
  },
  {
    name: 'Chinese (Min Zhong)',
    code: 'czo',
  },
  {
    name: 'Chinese (Pu-Xian)',
    code: 'cpx',
  },
  {
    name: 'Chinese Simplified',
    code: 'zh-Hans',
  },
  {
    name: 'Chinese Traditional',
    code: 'zh-Hant',
  },
  {
    name: 'Chinese (Wu)',
    code: 'wuu',
  },
  {
    name: 'Chinese (Xiang)',
    code: 'hsn',
  },
  {
    name: 'Chinese (Yue)',
    code: 'yue',
  },
  {
    name: 'Chuvash',
    code: 'cv',
  },
  {
    name: 'Colognian',
    code: 'ksh',
  },
  {
    name: 'Cornish',
    code: 'kw',
  },
  {
    name: 'Corsican',
    code: 'co',
  },
  {
    name: 'Crimean Turkish',
    code: 'crh',
  },
  {
    name: 'Croatian',
    code: 'hr',
  },
  {
    name: 'Czech',
    code: 'cs',
  },
  {
    name: 'Danish',
    code: 'da',
  },
  {
    name: 'Divehi',
    code: 'dv',
  },
  {
    name: 'Dogri',
    code: 'doi',
  },
  {
    name: 'Dutch',
    code: 'nl',
  },
  {
    name: 'Dzongkha',
    code: 'dz',
  },
  {
    name: 'English',
    code: 'en',
  },
  {
    name: 'Erzya',
    code: 'myv',
  },
  {
    name: 'Esperanto',
    code: 'eo',
  },
  {
    name: 'Estonian',
    code: 'et',
  },
  {
    name: 'Faroese',
    code: 'fo',
  },
  {
    name: 'Filipino',
    code: 'fil',
  },
  {
    name: 'Finnish',
    code: 'fi',
  },
  {
    name: 'Franco-Provençal (Arpitan)',
    code: 'frp',
  },
  {
    name: 'French',
    code: 'fr',
  },
  {
    name: 'Friulian',
    code: 'fur',
  },
  {
    name: 'Fulah',
    code: 'ff',
  },
  {
    name: 'Gaelic, Scottish',
    code: 'gd',
  },
  {
    name: 'Galician',
    code: 'gl',
  },
  {
    name: 'Ganda',
    code: 'lg',
  },
  {
    name: 'Georgian',
    code: 'ka',
  },
  {
    name: 'German',
    code: 'de',
  },
  {
    name: 'Greek',
    code: 'el',
  },
  {
    name: 'Greenlandic',
    code: 'kl',
  },
  {
    name: 'Gujarati',
    code: 'gu',
  },
  {
    name: 'Gun',
    code: 'gun',
  },
  {
    name: 'Haitian (Haitian Creole)',
    code: 'ht',
  },
  {
    name: 'Hausa',
    code: 'ha',
  },
  {
    name: 'Hawaiian',
    code: 'haw',
  },
  {
    name: 'Hebrew',
    code: 'he',
  },
  {
    name: 'Hindi',
    code: 'hi',
  },
  {
    name: 'Hungarian',
    code: 'hu',
  },
  {
    name: 'Icelandic',
    code: 'is',
  },
  {
    name: 'Ido',
    code: 'io',
  },
  {
    name: 'Igbo',
    code: 'ig',
  },
  {
    name: 'Iloko',
    code: 'ilo',
  },
  {
    name: 'Indonesian',
    code: 'id',
  },
  {
    name: 'Interlingua',
    code: 'ia',
  },
  {
    name: 'Inuktitut',
    code: 'iu',
  },
  {
    name: 'Irish',
    code: 'ga',
  },
  {
    name: 'Italian',
    code: 'it',
  },
  {
    name: 'Japanese',
    code: 'ja',
  },
  {
    name: 'Japanese (Hiragana)',
    code: 'ja-Hira',
  },
  {
    name: 'Javanese',
    code: 'jv',
  },
  {
    name: 'Kabardian',
    code: 'kbd',
  },
  {
    name: 'Kabyle',
    code: 'kab',
  },
  {
    name: 'Kannada',
    code: 'kn',
  },
  {
    name: 'Kapampangan',
    code: 'pam',
  },
  {
    name: 'Karelian',
    code: 'krl',
  },
  {
    name: 'Kashmiri',
    code: 'ks',
  },
  {
    name: 'Kashubian',
    code: 'csb',
  },
  {
    name: 'Kazakh',
    code: 'kk',
  },
  {
    name: 'Khmer',
    code: 'km',
  },
  {
    name: 'Kinyarwanda',
    code: 'rw',
  },
  {
    name: 'Klingon',
    code: 'tlh',
  },
  {
    name: 'Konkani',
    code: 'kok',
  },
  {
    name: 'Korean',
    code: 'ko',
  },
  {
    name: 'Kurdish',
    code: 'ku',
  },
  {
    name: 'Kyrgyz',
    code: 'ky',
  },
  {
    name: 'Ladino',
    code: 'lad',
  },
  {
    name: 'Lakota',
    code: 'lkt',
  },
  {
    name: 'Lao',
    code: 'lo',
  },
  {
    name: 'Latgalian',
    code: 'ltg',
  },
  {
    name: 'Latin',
    code: 'la',
  },
  {
    name: 'Latvian',
    code: 'lv',
  },
  {
    name: 'Lezghian',
    code: 'lez',
  },
  {
    name: 'Ligurian',
    code: 'lij',
  },
  {
    name: 'Limburgian',
    code: 'li',
  },
  {
    name: 'Lingala',
    code: 'ln',
  },
  {
    name: 'Lithuanian',
    code: 'lt',
  },
  {
    name: 'Lojban',
    code: 'jbo',
  },
  {
    name: 'Lombard',
    code: 'lmo',
  },
  {
    name: 'Lower Sorbian',
    code: 'dsb',
  },
  {
    name: 'Low German',
    code: 'nds',
  },
  {
    name: 'Luxembourgish',
    code: 'lb',
  },
  {
    name: 'Macedonian',
    code: 'mk',
  },
  {
    name: 'Maithili',
    code: 'mai',
  },
  {
    name: 'Malagasy',
    code: 'mg',
  },
  {
    name: 'Malay',
    code: 'ms',
  },
  {
    name: 'Malayalam',
    code: 'ml',
  },
  {
    name: 'Maltese',
    code: 'mt',
  },
  {
    name: 'Manipuri',
    code: 'mni',
  },
  {
    name: 'Maori',
    code: 'mi',
  },
  {
    name: 'Mapudungun',
    code: 'arn',
  },
  {
    name: 'Marathi',
    code: 'mr',
  },
  {
    name: 'Marshallese',
    code: 'mh',
  },
  {
    name: 'Mirandese',
    code: 'mw1',
  },
  {
    name: 'Mongolian',
    code: 'mn',
  },
  {
    name: 'Nahuatl',
    code: 'nah',
  },
  {
    name: 'Navajo',
    code: 'nv',
  },
  {
    name: 'Ndebele, North',
    code: 'nd',
  },
  {
    name: 'Ndebele, South',
    code: 'nr',
  },
  {
    name: 'Neapolitan',
    code: 'nap',
  },
  {
    name: 'Nepali',
    code: 'ne',
  },
  {
    name: 'Nias',
    code: 'nia',
  },
  {
    name: 'N\'ko',
    code: 'nqo',
  },
  {
    name: 'Northern Sami',
    code: 'se',
  },
  {
    name: 'Northern Sotho',
    code: 'nso',
  },
  {
    name: 'Norwegian',
    code: 'no',
  },
  {
    name: 'Norwegian Bokmål',
    code: 'nb',
  },
  {
    name: 'Norwegian Nynorsk',
    code: 'nn',
  },
  {
    name: 'Nyanja',
    code: 'ny',
  },
  {
    name: 'Occitan (post 1500)',
    code: 'oc',
  },
  {
    name: 'Oriya',
    code: 'or',
  },
  {
    name: 'Oromo',
    code: 'om',
  },
  {
    name: 'Ossetic',
    code: 'os',
  },
  {
    name: 'Palatinate German',
    code: 'pfl',
  },
  {
    name: 'Panjabi (Punjabi)',
    code: 'pa',
  },
  {
    name: 'Papiamento',
    code: 'pap',
  },
  {
    name: 'Persian',
    code: 'fa',
  },
  {
    name: 'Piemontese',
    code: 'pms',
  },
  {
    name: 'Polish',
    code: 'pl',
  },
  {
    name: 'Portuguese',
    code: 'pt',
  },
  {
    name: 'Pushto',
    code: 'ps',
  },
  {
    name: 'Romanian',
    code: 'ro',
  },
  {
    name: 'Romansh',
    code: 'rm',
  },
  {
    name: 'Russian',
    code: 'ru',
  },
  {
    name: 'Sakha (Yakut)',
    code: 'sah',
  },
  {
    name: 'Samoan',
    code: 'sm',
  },
  {
    name: 'Sango',
    code: 'sg',
  },
  {
    name: 'Sanskrit',
    code: 'sa',
  },
  {
    name: 'Santali',
    code: 'sat',
  },
  {
    name: 'Sardinian',
    code: 'sc',
  },
  {
    name: 'Scots',
    code: 'sco',
  },
  {
    name: 'Serbian',
    code: 'sr',
  },
  {
    name: 'Shona',
    code: 'sn',
  },
  {
    name: 'Sicilian',
    code: 'scn',
  },
  {
    name: 'Silesian',
    code: 'szl',
  },
  {
    name: 'Sindhi',
    code: 'sd',
  },
  {
    name: 'Sinhala',
    code: 'si',
  },
  {
    name: 'Slovak',
    code: 'sk',
  },
  {
    name: 'Slovenian',
    code: 'sl',
  },
  {
    name: 'Somali',
    code: 'so',
  },
  {
    name: 'Songhay',
    code: 'son',
  },
  {
    name: 'Sotho, Southern',
    code: 'st',
  },
  {
    name: 'Southern Sami',
    code: 'sma',
  },
  {
    name: 'Spanish',
    code: 'es',
  },
  {
    name: 'Sundanese',
    code: 'su',
  },
  {
    name: 'Swahili',
    code: 'sw',
  },
  {
    name: 'Swati',
    code: 'ss',
  },
  {
    name: 'Swedish',
    code: 'sv',
  },
  {
    name: 'Tagalog',
    code: 'tl',
  },
  {
    name: 'Tajik',
    code: 'tg',
  },
  {
    name: 'Talossan',
    code: 'tzl',
  },
  {
    name: 'Tamil',
    code: 'ta',
  },
  {
    name: 'Tatar',
    code: 'tt',
  },
  {
    name: 'Telugu',
    code: 'te',
  },
  {
    name: 'Tetum (Tetun)',
    code: 'tet',
  },
  {
    name: 'Thai',
    code: 'th',
  },
  {
    name: 'Tibetan',
    code: 'bo',
  },
  {
    name: 'Tigrinya',
    code: 'ti',
  },
  {
    name: 'Tongan',
    code: 'to',
  },
  {
    name: 'Tsimshian',
    code: 'tsi',
  },
  {
    name: 'Tsonga',
    code: 'ts',
  },
  {
    name: 'Tswana',
    code: 'tn',
  },
  {
    name: 'Turkish',
    code: 'tr',
  },
  {
    name: 'Turkmen',
    code: 'tk',
  },
  {
    name: 'Udmurt',
    code: 'udm',
  },
  {
    name: 'Uighur',
    code: 'ug',
  },
  {
    name: 'Ukrainian',
    code: 'uk',
  },
  {
    name: 'Upper Franconian',
    code: 'vmf',
  },
  {
    name: 'Upper Sorbian',
    code: 'hsb',
  },
  {
    name: 'Urdu',
    code: 'ur',
  },
  {
    name: 'Uzbek',
    code: 'uz',
  },
  {
    name: 'Venda',
    code: 've',
  },
  {
    name: 'Venetian',
    code: 'vec',
  },
  {
    name: 'Vepsian',
    code: 'vep',
  },
  {
    name: 'Vietnamese',
    code: 'vi',
  },
  {
    name: 'Vlaams',
    code: 'vls',
  },
  {
    name: 'Volapük',
    code: 'vo',
  },
  {
    name: 'Walloon',
    code: 'wa',
  },
  {
    name: 'Wáray-Wáray',
    code: 'war',
  },
  {
    name: 'Welsh',
    code: 'cy',
  },
  {
    name: 'Western Frisian',
    code: 'fy',
  },
  {
    name: 'Wolof',
    code: 'wo',
  },
  {
    name: 'Xhosa',
    code: 'xh',
  },
  {
    name: 'Yiddish',
    code: 'yi',
  },
  {
    name: 'Yoruba',
    code: 'yo',
  },
  {
    name: 'Zulu',
    code: 'zu',
  },
];

let _indexedLangs;

function getIndexedLangs() {
  if (_indexedLangs) return _indexedLangs;

  _indexedLangs = languages.reduce((indexedObj, language) => {
    indexedObj[language.code] = _.omit(language, 'code');
    return indexedObj;
  }, {});

  return _indexedLangs;
}

export function getLangByCode(code) {
  if (!code) {
    throw new Error('Please provide a language code.');
  }

  return getIndexedLangs()[code];
}

export default languages;

const translationLangs = [
  {
    name: 'English (English, America)',
    code: 'en-US',
  },
  {
    name: 'Arabic',
    code: 'ar',
  },
  // {
  //   name: '中文 (Chinese, S)',
  //   code: 'zh-CN',
  // },
  // {
  //   name: 'Czech (Czech)',
  //   code: 'cs',
  // },
  // {
  //   name: 'Croatian (Croatian, Croatia)',
  //   code: 'hr-HR',
  // },
  {
    name: 'Dansk (Danish)',
    code: 'da',
  },
  {
    name: 'Deutsch (German, Germany)',
    code: 'de-DE',
  },
  {
    name: 'Dutch (Dutch, Netherlands)',
    code: 'nl-NL',
  },
  {
    name: 'English (English, Australia)',
    code: 'en-AU',
  },
  {
    name: 'Espa&ntilde;ol (Spanish)',
    code: 'es',
  },
  // {
  //   name: 'Esperanto',
  //   code: 'eo',
  // },
  {
    name: 'Français (French, Canada)',
    code: 'fr-CA',
  },
  {
    name: 'Français (French)',
    code: 'fr',
  },
  // {
  //   name: 'Greek (Greek)',
  //   code: 'el',
  // },
  // {
  //   name: 'Italiano (Italian)',
  //   code: 'it',
  // },
  // {
  //   name: '日本語 (Japanese, Japan)',
  //   code: 'ja-JP',
  // },
  // {
  //   name: '한국어 (Korean)',
  //   code: 'ko',
  // },
  // {
  // name: 'Polski (Polish)',
  // code: 'pl',
  // },
  {
    name: 'Português (Portuguese, Brazil)',
    code: 'pt-BR',
  },
  // {
  //   name: 'Română (Romanian)',
  //   code: 'ro',
  // },
  // {
  //   name: 'Russian (Russian)',
  //   code: 'ru',
  // },
  // {
  //   name: 'Slovenský jazyk (Slovak)',
  //   code: 'sk',
  // },
  // {
  //   name: 'Turkish (Turkish)',
  //   code: 'tr',
  // },
  // {
  //   name: 'Українська (Ukrainian)',
  //   code: 'uk',
  // },
  // {
  //   name: 'Uzbek (Uzbek)',
  //   code: 'uz',
  // },
];
