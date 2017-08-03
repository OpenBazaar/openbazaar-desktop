export function getDefaultSearchProviders() {
  const defaultSearchProviders = [
    {
      id: 'OB1',
      title: 'OB1 Search',
      logoUrl: '../imgs/ob1searchLogo.png',
      searchUrl: 'https://search.ob1.io/search/listings',
      torSearchUrl: 'https://search.ob1.io/search/listings',
      isDefault: true,
    },
    {
      id: 'Duo',
      title: 'Duo Search',
      logoUrl: '../imgs/duoSearchLogo.png',
      searchUrl: 'https://search.duosearch.com/search/listings',
      torSearchUrl: 'https://torSearch.duosearch.com/search/listings',
      isDefault: false,
    },
  ];

  return defaultSearchProviders;
}
