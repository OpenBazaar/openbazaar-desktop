// Object where we can (very judiciously) attach any app-wide
// shared state (e.g. router)

export default {
  // Short-hand convenience method to get the HTTP url of the active server configuration
  getServerUrl(urlFrag = '') {
    if (!this.serverConfigs) {
      throw new Error('I\'m expecting a ServerConfigs collection instance to have' +
        ' been attached to this instance.');
    }

    return this.serverConfigs.activeServer ?
      `${this.serverConfigs.activeServer.httpUrl}${urlFrag}` : '';
  },

  serverConfig: {},
};
