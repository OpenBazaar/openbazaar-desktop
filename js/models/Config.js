/**
 * This differs from the ServerConfig model. This contains the configuartion provided from
 * from the server via the ob/config api. Whereas, ServerConfig is a representation of a
 * connection to the server and is stored in local storage.
 */

import app from '../app';
import { getCurrencyByCode as getCryptoCurrencyByCode } from '../data/cryptoCurrencies';
import BaseModel from './BaseModel';

export default class extends BaseModel {
  url() {
    return app.getServerUrl('ob/config');
  }

  defaults() {
    return {
      wallets: [],
    };
  }

  parse(response = {}) {
    return {
      ...response,
      wallets: (response.wallets || [])
        .reduce((acc, cryptoCur) => {
          // Unsupported indicates that this client cannot support the given currency for use in
          // the wallet. The reason is that there is no entry in the cryptoCurrencies data file
          // which contains fundamental information the client needs (e.g. baseUnit).
          acc[cryptoCur] = { unsupported: !!getCryptoCurrencyByCode(cryptoCur) };
          return acc;
        }, {}),
    };
  }
}

