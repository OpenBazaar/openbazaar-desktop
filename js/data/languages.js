import _ from 'underscore';

const languages = [
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
  // {
  //   name: 'Dutch (Dutch, Netherlands)',
  //   code: 'nl-NL',
  // },
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
