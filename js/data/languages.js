import _ from 'underscore';
import app from '../app';

const languages = [
  {
    code: 'af',
    name: 'Afrikaans',
  },
  {
    code: 'af-ZA',
    name: 'Afrikaans (South Africa)',
  },
  {
    code: 'ar',
    name: 'Arabic',
  },
  {
    code: 'ar-AE',
    name: 'Arabic (U.A.E.)',
  },
  {
    code: 'ar-BH',
    name: 'Arabic (Bahrain)',
  },
  {
    code: 'ar-DZ',
    name: 'Arabic (Algeria)',
  },
  {
    code: 'ar-EG',
    name: 'Arabic (Egypt)',
  },
  {
    code: 'ar-IQ',
    name: 'Arabic (Iraq)',
  },
  {
    code: 'ar-JO',
    name: 'Arabic (Jordan)',
  },
  {
    code: 'ar-KW',
    name: 'Arabic (Kuwait)',
  },
  {
    code: 'ar-LB',
    name: 'Arabic (Lebanon)',
  },
  {
    code: 'ar-LY',
    name: 'Arabic (Libya)',
  },
  {
    code: 'ar-MA',
    name: 'Arabic (Morocco)',
  },
  {
    code: 'ar-OM',
    name: 'Arabic (Oman)',
  },
  {
    code: 'ar-QA',
    name: 'Arabic (Qatar)',
  },
  {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
  },
  {
    code: 'ar-SY',
    name: 'Arabic (Syria)',
  },
  {
    code: 'ar-TN',
    name: 'Arabic (Tunisia)',
  },
  {
    code: 'ar-YE',
    name: 'Arabic (Yemen)',
  },
  {
    code: 'az',
    name: 'Azeri (Latin)',
  },
  {
    code: 'az-AZ',
    name: 'Azeri (Latin) (Azerbaijan)',
  },
  {
    code: 'az-AZ',
    name: 'Azeri (Cyrillic) (Azerbaijan)',
  },
  {
    code: 'be',
    name: 'Belarusian',
  },
  {
    code: 'be-BY',
    name: 'Belarusian (Belarus)',
  },
  {
    code: 'bg',
    name: 'Bulgarian',
  },
  {
    code: 'bg-BG',
    name: 'Bulgarian (Bulgaria)',
  },
  {
    code: 'bs-BA',
    name: 'Bosnian (Bosnia and Herzegovina)',
  },
  {
    code: 'ca',
    name: 'Catalan',
  },
  {
    code: 'ca-ES',
    name: 'Catalan (Spain)',
  },
  {
    code: 'cs',
    name: 'Czech',
  },
  {
    code: 'cs-CZ',
    name: 'Czech (Czech Republic)',
  },
  {
    code: 'cy',
    name: 'Welsh',
  },
  {
    code: 'cy-GB',
    name: 'Welsh (United Kingdom)',
  },
  {
    code: 'da',
    name: 'Danish',
  },
  {
    code: 'da-DK',
    name: 'Danish (Denmark)',
  },
  {
    code: 'de',
    name: 'German',
  },
  {
    code: 'de-AT',
    name: 'German (Austria)',
  },
  {
    code: 'de-CH',
    name: 'German (Switzerland)',
  },
  {
    code: 'de-DE',
    name: 'German (Germany)',
  },
  {
    code: 'de-LI',
    name: 'German (Liechtenstein)',
  },
  {
    code: 'de-LU',
    name: 'German (Luxembourg)',
  },
  {
    code: 'dv',
    name: 'Divehi',
  },
  {
    code: 'dv-MV',
    name: 'Divehi (Maldives)',
  },
  {
    code: 'el',
    name: 'Greek',
  },
  {
    code: 'el-GR',
    name: 'Greek (Greece)',
  },
  {
    code: 'en',
    name: 'English',
  },
  {
    code: 'en-AU',
    name: 'English (Australia)',
  },
  {
    code: 'en-BZ',
    name: 'English (Belize)',
  },
  {
    code: 'en-CA',
    name: 'English (Canada)',
  },
  {
    code: 'en-CB',
    name: 'English (Caribbean)',
  },
  {
    code: 'en-GB',
    name: 'English (United Kingdom)',
  },
  {
    code: 'en-IE',
    name: 'English (Ireland)',
  },
  {
    code: 'en-JM',
    name: 'English (Jamaica)',
  },
  {
    code: 'en-NZ',
    name: 'English (New Zealand)',
  },
  {
    code: 'en-PH',
    name: 'English (Republic of the Philippines)',
  },
  {
    code: 'en-TT',
    name: 'English (Trinidad and Tobago)',
  },
  {
    code: 'en-US',
    name: 'English (United States)',
  },
  {
    code: 'en-ZA',
    name: 'English (South Africa)',
  },
  {
    code: 'en-ZW',
    name: 'English (Zimbabwe)',
  },
  {
    code: 'eo',
    name: 'Esperanto',
  },
  {
    code: 'es',
    name: 'Spanish',
  },
  {
    code: 'es-AR',
    name: 'Spanish (Argentina)',
  },
  {
    code: 'es-BO',
    name: 'Spanish (Bolivia)',
  },
  {
    code: 'es-CL',
    name: 'Spanish (Chile)',
  },
  {
    code: 'es-CO',
    name: 'Spanish (Colombia)',
  },
  {
    code: 'es-CR',
    name: 'Spanish (Costa Rica)',
  },
  {
    code: 'es-DO',
    name: 'Spanish (Dominican Republic)',
  },
  {
    code: 'es-EC',
    name: 'Spanish (Ecuador)',
  },
  {
    code: 'es-ES',
    name: 'Spanish (Castilian)',
  },
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
  },
  {
    code: 'es-GT',
    name: 'Spanish (Guatemala)',
  },
  {
    code: 'es-HN',
    name: 'Spanish (Honduras)',
  },
  {
    code: 'es-MX',
    name: 'Spanish (Mexico)',
  },
  {
    code: 'es-NI',
    name: 'Spanish (Nicaragua)',
  },
  {
    code: 'es-PA',
    name: 'Spanish (Panama)',
  },
  {
    code: 'es-PE',
    name: 'Spanish (Peru)',
  },
  {
    code: 'es-PR',
    name: 'Spanish (Puerto Rico)',
  },
  {
    code: 'es-PY',
    name: 'Spanish (Paraguay)',
  },
  {
    code: 'es-SV',
    name: 'Spanish (El Salvador)',
  },
  {
    code: 'es-UY',
    name: 'Spanish (Uruguay)',
  },
  {
    code: 'es-VE',
    name: 'Spanish (Venezuela)',
  },
  {
    code: 'et',
    name: 'Estonian',
  },
  {
    code: 'et-EE',
    name: 'Estonian (Estonia)',
  },
  {
    code: 'eu',
    name: 'Basque',
  },
  {
    code: 'eu-ES',
    name: 'Basque (Spain)',
  },
  {
    code: 'fa',
    name: 'Farsi',
  },
  {
    code: 'fa-IR',
    name: 'Farsi (Iran)',
  },
  {
    code: 'fi',
    name: 'Finnish',
  },
  {
    code: 'fi-FI',
    name: 'Finnish (Finland)',
  },
  {
    code: 'fo',
    name: 'Faroese',
  },
  {
    code: 'fo-FO',
    name: 'Faroese (Faroe Islands)',
  },
  {
    code: 'fr',
    name: 'French',
  },
  {
    code: 'fr-BE',
    name: 'French (Belgium)',
  },
  {
    code: 'fr-CA',
    name: 'French (Canada)',
  },
  {
    code: 'fr-CH',
    name: 'French (Switzerland)',
  },
  {
    code: 'fr-FR',
    name: 'French (France)',
  },
  {
    code: 'fr-LU',
    name: 'French (Luxembourg)',
  },
  {
    code: 'fr-MC',
    name: 'French (Principality of Monaco)',
  },
  {
    code: 'gl',
    name: 'Galician',
  },
  {
    code: 'gl-ES',
    name: 'Galician (Spain)',
  },
  {
    code: 'gu',
    name: 'Gujarati',
  },
  {
    code: 'gu-IN',
    name: 'Gujarati (India)',
  },
  {
    code: 'he',
    name: 'Hebrew',
  },
  {
    code: 'he-IL',
    name: 'Hebrew (Israel)',
  },
  {
    code: 'hi',
    name: 'Hindi',
  },
  {
    code: 'hi-IN',
    name: 'Hindi (India)',
  },
  {
    code: 'hr',
    name: 'Croatian',
  },
  {
    code: 'hr-BA',
    name: 'Croatian (Bosnia and Herzegovina)',
  },
  {
    code: 'hr-HR',
    name: 'Croatian (Croatia)',
  },
  {
    code: 'hu',
    name: 'Hungarian',
  },
  {
    code: 'hu-HU',
    name: 'Hungarian (Hungary)',
  },
  {
    code: 'hy',
    name: 'Armenian',
  },
  {
    code: 'hy-AM',
    name: 'Armenian (Armenia)',
  },
  {
    code: 'id',
    name: 'Indonesian',
  },
  {
    code: 'id-ID',
    name: 'Indonesian (Indonesia)',
  },
  {
    code: 'is',
    name: 'Icelandic',
  },
  {
    code: 'is-IS',
    name: 'Icelandic (Iceland)',
  },
  {
    code: 'it',
    name: 'Italian',
  },
  {
    code: 'it-CH',
    name: 'Italian (Switzerland)',
  },
  {
    code: 'it-IT',
    name: 'Italian (Italy)',
  },
  {
    code: 'ja',
    name: 'Japanese',
  },
  {
    code: 'ja-JP',
    name: 'Japanese (Japan)',
  },
  {
    code: 'ka',
    name: 'Georgian',
  },
  {
    code: 'ka-GE',
    name: 'Georgian (Georgia)',
  },
  {
    code: 'kk',
    name: 'Kazakh',
  },
  {
    code: 'kk-KZ',
    name: 'Kazakh (Kazakhstan)',
  },
  {
    code: 'kn',
    name: 'Kannada',
  },
  {
    code: 'kn-IN',
    name: 'Kannada (India)',
  },
  {
    code: 'ko',
    name: 'Korean',
  },
  {
    code: 'ko-KR',
    name: 'Korean (Korea)',
  },
  {
    code: 'kok',
    name: 'Konkani',
  },
  {
    code: 'kok-IN',
    name: 'Konkani (India)',
  },
  {
    code: 'ky',
    name: 'Kyrgyz',
  },
  {
    code: 'ky-KG',
    name: 'Kyrgyz (Kyrgyzstan)',
  },
  {
    code: 'lt',
    name: 'Lithuanian',
  },
  {
    code: 'lt-LT',
    name: 'Lithuanian (Lithuania)',
  },
  {
    code: 'lv',
    name: 'Latvian',
  },
  {
    code: 'lv-LV',
    name: 'Latvian (Latvia)',
  },
  {
    code: 'mi',
    name: 'Maori',
  },
  {
    code: 'mi-NZ',
    name: 'Maori (New Zealand)',
  },
  {
    code: 'mk',
    name: 'FYRO Macedonian',
  },
  {
    code: 'mk-MK',
    name: 'FYRO Macedonian (Former Yugoslav Republic of Macedonia)',
  },
  {
    code: 'mn',
    name: 'Mongolian',
  },
  {
    code: 'mn-MN',
    name: 'Mongolian (Mongolia)',
  },
  {
    code: 'mr',
    name: 'Marathi',
  },
  {
    code: 'mr-IN',
    name: 'Marathi (India)',
  },
  {
    code: 'ms',
    name: 'Malay',
  },
  {
    code: 'ms-BN',
    name: 'Malay (Brunei Darussalam)',
  },
  {
    code: 'ms-MY',
    name: 'Malay (Malaysia)',
  },
  {
    code: 'mt',
    name: 'Maltese',
  },
  {
    code: 'mt-MT',
    name: 'Maltese (Malta)',
  },
  {
    code: 'nb',
    name: 'Norwegian (Bokmål)',
  },
  {
    code: 'nb-NO',
    name: 'Norwegian (Bokmål) (Norway)',
  },
  {
    code: 'nl',
    name: 'Dutch',
  },
  {
    code: 'nl-BE',
    name: 'Dutch (Belgium)',
  },
  {
    code: 'nl-NL',
    name: 'Dutch (Netherlands)',
  },
  {
    code: 'nn-NO',
    name: 'Norwegian (Nynorsk) (Norway)',
  },
  {
    code: 'ns',
    name: 'Northern Sotho',
  },
  {
    code: 'ns-ZA',
    name: 'Northern Sotho (South Africa)',
  },
  {
    code: 'pa',
    name: 'Punjabi',
  },
  {
    code: 'pa-IN',
    name: 'Punjabi (India)',
  },
  {
    code: 'pl',
    name: 'Polish',
  },
  {
    code: 'pl-PL',
    name: 'Polish (Poland)',
  },
  {
    code: 'ps',
    name: 'Pashto',
  },
  {
    code: 'ps-AR',
    name: 'Pashto (Afghanistan)',
  },
  {
    code: 'pt',
    name: 'Portuguese',
  },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
  },
  {
    code: 'pt-PT',
    name: 'Portuguese (Portugal)',
  },
  {
    code: 'qu',
    name: 'Quechua',
  },
  {
    code: 'qu-BO',
    name: 'Quechua (Bolivia)',
  },
  {
    code: 'qu-EC',
    name: 'Quechua (Ecuador)',
  },
  {
    code: 'qu-PE',
    name: 'Quechua (Peru)',
  },
  {
    code: 'ro',
    name: 'Romanian',
  },
  {
    code: 'ro-RO',
    name: 'Romanian (Romania)',
  },
  {
    code: 'ru',
    name: 'Russian',
  },
  {
    code: 'ru-RU',
    name: 'Russian (Russia)',
  },
  {
    code: 'sa',
    name: 'Sanskrit',
  },
  {
    code: 'sa-IN',
    name: 'Sanskrit (India)',
  },
  {
    code: 'se',
    name: 'Sami (Northern)',
  },
  {
    code: 'se-FI',
    name: 'Sami (Northern) (Finland)',
  },
  {
    code: 'se-FI',
    name: 'Sami (Skolt) (Finland)',
  },
  {
    code: 'se-FI',
    name: 'Sami (Inari) (Finland)',
  },
  {
    code: 'se-NO',
    name: 'Sami (Northern) (Norway)',
  },
  {
    code: 'se-NO',
    name: 'Sami (Lule) (Norway)',
  },
  {
    code: 'se-NO',
    name: 'Sami (Southern) (Norway)',
  },
  {
    code: 'se-SE',
    name: 'Sami (Northern) (Sweden)',
  },
  {
    code: 'se-SE',
    name: 'Sami (Lule) (Sweden)',
  },
  {
    code: 'se-SE',
    name: 'Sami (Southern) (Sweden)',
  },
  {
    code: 'sk',
    name: 'Slovak',
  },
  {
    code: 'sk-SK',
    name: 'Slovak (Slovakia)',
  },
  {
    code: 'sl',
    name: 'Slovenian',
  },
  {
    code: 'sl-SI',
    name: 'Slovenian (Slovenia)',
  },
  {
    code: 'sq',
    name: 'Albanian',
  },
  {
    code: 'sq-AL',
    name: 'Albanian (Albania)',
  },
  {
    code: 'sr-BA',
    name: 'Serbian (Latin) (Bosnia and Herzegovina)',
  },
  {
    code: 'sr-BA',
    name: 'Serbian (Cyrillic) (Bosnia and Herzegovina)',
  },
  {
    code: 'sr-SP',
    name: 'Serbian (Latin) (Serbia and Montenegro)',
  },
  {
    code: 'sr-SP',
    name: 'Serbian (Cyrillic) (Serbia and Montenegro)',
  },
  {
    code: 'sv',
    name: 'Swedish',
  },
  {
    code: 'sv-FI',
    name: 'Swedish (Finland)',
  },
  {
    code: 'sv-SE',
    name: 'Swedish (Sweden)',
  },
  {
    code: 'sw',
    name: 'Swahili',
  },
  {
    code: 'sw-KE',
    name: 'Swahili (Kenya)',
  },
  {
    code: 'syr',
    name: 'Syriac',
  },
  {
    code: 'syr-SY',
    name: 'Syriac (Syria)',
  },
  {
    code: 'ta',
    name: 'Tamil',
  },
  {
    code: 'ta-IN',
    name: 'Tamil (India)',
  },
  {
    code: 'te',
    name: 'Telugu',
  },
  {
    code: 'te-IN',
    name: 'Telugu (India)',
  },
  {
    code: 'th',
    name: 'Thai',
  },
  {
    code: 'th-TH',
    name: 'Thai (Thailand)',
  },
  {
    code: 'tl',
    name: 'Tagalog',
  },
  {
    code: 'tl-PH',
    name: 'Tagalog (Philippines)',
  },
  {
    code: 'tn',
    name: 'Tswana',
  },
  {
    code: 'tn-ZA',
    name: 'Tswana (South Africa)',
  },
  {
    code: 'tr',
    name: 'Turkish',
  },
  {
    code: 'tr-TR',
    name: 'Turkish (Turkey)',
  },
  {
    code: 'tt',
    name: 'Tatar',
  },
  {
    code: 'tt-RU',
    name: 'Tatar (Russia)',
  },
  {
    code: 'ts',
    name: 'Tsonga',
  },
  {
    code: 'uk',
    name: 'Ukrainian',
  },
  {
    code: 'uk-UA',
    name: 'Ukrainian (Ukraine)',
  },
  {
    code: 'ur',
    name: 'Urdu',
  },
  {
    code: 'ur-PK',
    name: 'Urdu (Islamic Republic of Pakistan)',
  },
  {
    code: 'uz',
    name: 'Uzbek (Latin)',
  },
  {
    code: 'uz-UZ',
    name: 'Uzbek (Latin) (Uzbekistan)',
  },
  {
    code: 'uz-UZ',
    name: 'Uzbek (Cyrillic) (Uzbekistan)',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
  },
  {
    code: 'vi-VN',
    name: 'Vietnamese (Viet Nam)',
  },
  {
    code: 'xh',
    name: 'Xhosa',
  },
  {
    code: 'xh-ZA',
    name: 'Xhosa (South Africa)',
  },
  {
    code: 'zh',
    name: 'Chinese',
  },
  {
    code: 'zh-CN',
    name: 'Chinese (S)',
  },
  {
    code: 'zh-HK',
    name: 'Chinese (Hong Kong)',
  },
  {
    code: 'zh-MO',
    name: 'Chinese (Macau)',
  },
  {
    code: 'zh-SG',
    name: 'Chinese (Singapore)',
  },
  {
    code: 'zh-TW',
    name: 'Chinese (T)',
  },
  {
    code: 'zu',
    name: 'Zulu',
  },
  {
    code: 'zu-ZA',
    name: 'Zulu (South Africa)',
  },
];

export default languages;

let _indexedLangs;

function getIndexedLanguages() {
  if (_indexedLangs) return _indexedLangs;

  _indexedLangs = languages.reduce((indexedObj, lang) => {
    indexedObj[lang.code] = _.omit(lang, 'code');
    return indexedObj;
  }, {});

  return _indexedLangs;
}

export function getLangByCode(code, translate = true, lang = app && app.localSettings &&
  app.localSettings.standardizedTranslatedLang() || 'en-US') {
  if (!code) {
    throw new Error('Please provide a language code.');
  }

  if (translate && !lang) {
    throw new Error('If you\'d like the name translated, please provide a ' +
      'language.');
  }

  let langObj = getIndexedLanguages()[code];

  let translatedName;
  if (translate) {
    if (!(app && app.polyglot)) {
      console.warn('Unable to translate the name because the polyglot object is not available.');
    } else {
      translatedName = app.polyglot.t(`languages.${code}`);
    }
  }

  if (langObj) {
    langObj = {
      ...langObj,
      name: translatedName || langObj.name,
    };
  }

  return langObj;
}

function getTranslatedLangs(lang = app && app.localSettings &&
  app.localSettings.standardizedTranslatedLang() || 'en-US', sort = true) {
  if (!lang) {
    throw new Error('Please provide the language the translated languages' +
      ' should be returned in.');
  }

  let translated = languages.map(language => {
    let translatedName;
    if (!(app && app.polyglot)) {
      console.warn('Unable to translate the name because the polyglot object is not available.');
    } else {
      translatedName = app.polyglot.t(`languages.${language.code}`);
    }

    return {
      ...language,
      name: translatedName || language.name,
    };
  });

  if (sort) {
    translated = translated.sort((a, b) => {
      let localizedCompare;

      try {
        localizedCompare = a.name.localeCompare(b.name, lang);
      } catch (e) {
        console.warn('Unable to sort the langs in a localized way. The lang '
          + `code ${lang} is not valid.`);
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

const memoizedGetTranslatedLangs =
  _.memoize(getTranslatedLangs, (lang, sort) => `${lang}-${!!sort}`);

export { memoizedGetTranslatedLangs as getTranslatedLangs };

export const translationLangs = [
  {
    name: 'English (English, America)',
    code: 'en_US',
  },
  {
    name: 'Arabic',
    code: 'ar',
    trumbowyg: 'ar',
  },
  {
    name: '中文 (Chinese, S)',
    code: 'zh_CN',
  },
  {
    name: 'Czech (Czech Republic)',
    code: 'cs_CZ',
    trumbowyg: 'cz',
  },
  // {
  //   name: 'Croatian (Croatian, Croatia)',
  //   code: 'hr_HR',
  // },
  {
    name: 'Dansk (Danish)',
    code: 'da',
    trumbowyg: 'da',
  },
  {
    name: 'Deutsch (German, Germany)',
    code: 'de_DE',
    trumbowyg: 'de',
  },
  {
    name: 'Dutch (Dutch, Netherlands)',
    code: 'nl_NL',
    trumbowyg: 'nl',
  },
  {
    name: 'English (English, Australia)',
    code: 'en_AU',
  },
  {
    name: 'Espa&ntilde;ol (Spanish)',
    code: 'es',
    trumbowyg: 'es',
  },
  // {
  //   name: 'Esperanto',
  //   code: 'eo',
  // },
  {
    name: 'Français (French, Canada)',
    code: 'fr_CA',
    trumbowyg: 'fr',
  },
  {
    name: 'Français (French)',
    code: 'fr',
    trumbowyg: 'fr',
  },
  // {
  //   name: 'Greek (Greek)',
  //   code: 'el',
  // },
  {
    name: 'Italiano (Italian, Italy)',
    code: 'it_IT',
    trumbowyg: 'it',
  },
  // {
  //   name: '日本語 (Japanese, Japan)',
  //   code: 'ja_JP',
  // },
  {
    name: 'Norwegian (Bokmål)',
    code: 'nb',
    trumbowyg: 'no_nb',
  },
  // {
  //   name: '한국어 (Korean)',
  //   code: 'ko',
  // },
  {
    name: 'Polski (Polish)',
    code: 'pl',
    trumbowyg: 'pl',
  },
  {
    name: 'Português (Portuguese, Brazil)',
    code: 'pt_BR',
    trumbowyg: 'pt_br',
  },
  // {
  //   name: 'Română (Romanian)',
  //   code: 'ro',
  // },
  {
    name: 'Russian (Russian)',
    code: 'ru',
    trumbowyg: 'ru',
  },
  // {
  //   name: 'Slovenský jazyk (Slovak)',
  //   code: 'sk',
  // },
  // {
  //   name: 'Turkish (Turkish)',
  //   code: 'tr',
// },
  {
    name: 'Українська (Ukrainian)',
    code: 'uk',
    trumbowyg: 'ua',
  },
  // {
  //   name: 'Uzbek (Uzbek)',
  //   code: 'uz',
  // },
];

let _indexedTranslationLangs;

function getIndexedTranslationLang() {
  if (_indexedTranslationLangs) return _indexedTranslationLangs;

  _indexedTranslationLangs = translationLangs.reduce((indexedObj, lang) => {
    indexedObj[lang.code] = _.omit(lang, 'code');
    return indexedObj;
  }, {});

  return _indexedTranslationLangs;
}

export function getTranslationLangByCode(code) {
  if (!code) {
    throw new Error('Please provide a language code.');
  }

  return getIndexedTranslationLang()[code];
}

export function getTrumboLangFileNameByCode(code) {
  if (!code) {
    throw new Error('Please provide a language code.');
  }

  const lang = getIndexedTranslationLang()[code];
  return lang ? lang.trumbowyg : null;
}
