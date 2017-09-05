const defaultSearchProviders = [
  {
    id: 'ob1',
    name: 'OB1',
    logo: '../imgs/ob1searchLogo.png',
    search: 'https://search.ob1.io/search',
    listings: 'https://search.ob1.io/search/listings',
    torsearch: 'http://obsearchwhcqnhvj.onion/search',
    torlistings: 'http://obsearchwhcqnhvj.onion/search/listings',
    locked: true,
  },
  {
    id: 'duo',
    name: 'Duo',
    logo: '../imgs/duoSearchLogo.png',
    search: 'https://ob2.duosear.ch/search',
    listings: 'https://ob2.duosear.ch/search/listings',
    torsearch: 'https://ob2.duosear.ch/search',
    torlistings: 'https://ob2.duosear.ch/search/listings',
    locked: true,
  },
];

export default defaultSearchProviders;
