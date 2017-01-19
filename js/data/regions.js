import _ from 'underscore';
import app from '../app';
import countries from './countries';

const regions = [
  {
    id: 'EUROPEAN_UNION',
    countries: [
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
    ]
  },
  {
    id: 'EUROPEAN_ECONOMIC_AREA',
    countries: [
    'ICELAND',
    'LIECHTENSTEIN',
    'NORWAY',
  ],
];

regions.EUROPEAN_ECONOMIC_AREA.countries =
  regions.EUROPEAN_UNION
    .countries
    .concat(regions.countries.EUROPEAN_ECONOMIC_AREA);

regions.ALL.countries = countries.map(country => country.dataName);

function getTranslatedRegions(lang, sort = true) {
  if (!lang) {
    throw new Error('Please provide the language the translated regions' +
      ' should be returned in.');
  }

  let translated = regions.map(region => {
    ...region,
    name: app.polyglot.t(`regions.${region.id}`),
  });

  if (sort) {
    translated = translated.sort((a.name, b) => a.localeCompare(b.name, lang));
  }

  return translated;
}

const memoizedGetTranslatedRegions =
  _.memoize(getTranslatedRegions, (lang, sort) => `${lang}-${!!sort}`);

export { memoizedGetTranslatedRegions as getTranslatedRegions };

export default regions;
