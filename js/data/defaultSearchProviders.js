import app from '../app';

export function getDefaultSearchProviders() {
  const defaultSearchProviders = [
    {
      id: 'OB1',
      title: 'OB1 Search',
      logoUrl: app.getServerUrl('imgs/ob1searchLogo.png'),
      searchUrl: 'https://search.ob1.io/search/listings',
      torSearchUrl: 'https://search.ob1.io/search/listings',
      isDefault: true,
    },
    {
      id: 'Duo',
      title: 'Duo Search',
      logoUrl: app.getServerUrl('imgs/duoSearchLogo.png'),
      searchUrl: 'https://search.ob1.io/search/listings',
      torSearchUrl: 'https://search.ob1.io/search/listings',
      isDefault: false,
    },
  ];

  return defaultSearchProviders;
}
