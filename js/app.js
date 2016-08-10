// Object where we can (very judiciously) attach any app-wide
// shared state (e.g. router)

export default {
  getServerUrl(urlFrag = '') {
    // until we implement our server connect flow,
    // we'll just hard code default server values.
    return `http://localhost:8080/${urlFrag}`;
  },

  // temporary until we implement our full server connection flow
  getSocketUrl() {
    return 'ws://localhost:18466';
  }
};
