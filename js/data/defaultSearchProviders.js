export function getDefaultSearchProviders() {
  const defaultSearchProviders = [
    {
      id: 'OB1',
      title: 'OB1 Search',
      logoUrl: '../imgs/ob1searchLogo.png',
      listingsUrl: 'https://search.ob1.io/search/listings',
      torListingsUrl: 'https://search.ob1.io/search/listings',
      isDefault: true,
      locked: true,
      order: 1,
    },
    {
      id: 'Duo',
      title: 'Duo Search',
      logoUrl: '../imgs/duoSearchLogo.png',
      listingsUrl: 'https://search.duosearch.com/search/listings',
      torListingsUrl: '',
      isDefault: false,
      locked: true,
      order: 2,
    },
  ];

  return defaultSearchProviders;
}
