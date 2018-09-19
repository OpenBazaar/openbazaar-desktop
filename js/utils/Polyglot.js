import Polyglot from 'node-polyglot';
import { ensureMainnetCode } from '../data/walletCurrencies';

export function getKey(key) {
  const splitKey = key.split('.');
  return splitKey.map((keyFrag, index) => {
    if (index === 1 && splitKey[0] === 'cryptoCurrencies' &&
      keyFrag) {
      return ensureMainnetCode(keyFrag);
    }

    return keyFrag;
  }).join('.');
}

export default class extends Polyglot {
  t(key, options) {
    return super.t(getKey(key), options);
  }
}

