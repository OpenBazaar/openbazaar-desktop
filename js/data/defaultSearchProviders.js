export function getDefaultSearchProviders() {
  const defaultSearchProviders = [
    {
      name: 'OB1',
      logo: '../imgs/ob1searchLogo.png',
      search: 'https://search.ob1.io/search',
      listings: 'https://search.ob1.io/search/listings',
      torsearch: 'http://obsearchwhcqnhvj.onion/search',
      torlistings: 'http://obsearchwhcqnhvj.onion/search/listings',
      isDefault: true,
      locked: true,
      order: 1,
    },
    {
      name: 'Duo',
      logo: '../imgs/duoSearchLogo.png',
      search: 'https://search.duosear.ch/search',
      listings: 'https://search.duosear.ch/search/listings',
      torsearch: '',
      torlistings: '',
      isDefault: false,
      locked: true,
      order: 2,
    },
  ];

  return defaultSearchProviders;
}
