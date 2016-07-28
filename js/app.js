// Object where we can (very judiciously) attach any app-wide
// shared state (e.g. router)

export default {
  getServerUrl(urlFrag = '') {
    // until we implement our server connect flow,
    // we'll just hard code default server values.
    //return `http://localhost:8080/${urlFrag}`;
    return `http://192.168.1.175:8080/${urlFrag}`;
  },
};
