import path from 'path';
import fs from 'fs';
import { before, after } from 'mocha';
import sinon from 'sinon';
import { JSDOM } from 'jsdom';
import bigNumber from 'bignumber.js';
import { walletCurs, walletCurDef } from './walletCurData';
import { init as initWalletCurs } from '../js/data/walletCurrencies';
import app from '../js/app';

const tmpFolderPath = path.join(__dirname, '../.tmp');

if (!fs.existsSync(tmpFolderPath)) {
  fs.mkdirSync(tmpFolderPath);
}

const indexPage = fs.readFileSync(`${__dirname}/../index.html`);
const dom = new JSDOM(indexPage, {
  url: 'http://localhost', // needed so LocalStorage is accesible to JSDOM
});

global.document = dom.window.document;
global.window = dom.window;
global.navigator = window.navigator;
global.$ = require('jquery')(window);

let getServerUrl;

before(function () {
  // Most models and many templates depend on getServerUrl which
  // depends on localStorage, which is not available to us in the
  // test environement. So... to work around that, we're stubbing
  // getServerUrl.
  getServerUrl = sinon.stub(app, 'getServerUrl',
    (urlFrag) => `http://localhost:8080/ob/${urlFrag}`);

  app.serverConfig = {
    ...(app.serverConfig || {}),
    wallets: walletCurs,
  };

  // this should match what's in start.js
  bigNumber.config({ RANGE: [-1e+9, 1e+9], DECIMAL_PLACES: 1e+9 });

  app.walletCurDef = walletCurDef;
  initWalletCurs(walletCurs, walletCurDef);
});

after(function () {
  getServerUrl.restore();
});
