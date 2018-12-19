export function getCurrenciesSortedByName(
  currencies = [],
  translations = {},
  lang = 'en-US'
) {
  return currencies.sort((a, b) => {
    const aTranslation = translations[`cryptoCurrencies.${a}`];
    const bTranslation = translations[`cryptoCurrencies.${b}`];
    const aName = aTranslation || a;
    const bName = bTranslation || b;
    return aName.localeCompare(bName, lang, { sensitivity: 'base' });
  }).map(cur => ({
    code: cur,
    name: translations[`cryptoCurrencies.${cur}`] || cur,
  }));
}
