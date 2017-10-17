import _ from 'underscore';
import app from '../app';
import countries from './countries';

const euCountries = [
  'AUSTRIA',
  'BELGIUM',
  'BULGARIA',
  'CROATIA',
  'CYPRUS',
  'CZECH_REPUBLIC',
  'DENMARK',
  'ESTONIA',
  'FINLAND',
  'FRANCE',
  'GERMANY',
  'GREECE',
  'HUNGARY',
  'IRELAND',
  'ITALY',
  'LATVIA',
  'LITHUANIA',
  'LUXEMBOURG',
  'MALTA',
  'NETHERLANDS',
  'POLAND',
  'PORTUGAL',
  'ROMANIA',
  'SLOVAKIA',
  'SLOVENIA',
  'SPAIN',
  'SWEDEN',
  'UNITED_KINGDOM',
];


const regions = [
  {
    id: 'ALL',
    countries: [...(countries.map(country => country.dataName))],
  },
  {
    id: 'EUROPEAN_UNION',
    countries: euCountries,
  },
  {
    id: 'EUROPEAN_ECONOMIC_AREA',
    countries: [
      ...euCountries,
      'ICELAND',
      'LIECHTENSTEIN',
      'NORWAY',
    ],
  },
];

export default regions;

let indexedRegions;

export function getIndexedRegions() {
  if (indexedRegions) return indexedRegions;

  indexedRegions = regions.reduce((indexedObj, region) => {
    indexedObj[region.id] = _.omit(region, 'id');
    return indexedObj;
  }, {});

  return indexedRegions;
}

function getTranslatedRegions(lang = app.localSettings.standardizedTranslatedLang(), sort = true) {
  if (!lang) {
    throw new Error('Please provide the language the translated regions' +
      ' should be returned in.');
  }

  let translated = regions.map(region => ({
    ...region,
    name: app.polyglot.t(`regions.${region.id}`),
  }));

  if (sort) {
    translated = translated.sort((a, b) => a.name.localeCompare(b.name, lang));
  }

  return translated;
}

const memoizedGetTranslatedRegions =
  _.memoize(getTranslatedRegions, (lang, sort) => `${lang}-${!!sort}`);

export { memoizedGetTranslatedRegions as getTranslatedRegions };

