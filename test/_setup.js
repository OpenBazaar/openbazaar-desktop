import path from 'path';
import fs from 'fs';
import { before, after } from 'mocha';
import sinon from 'sinon';
import app from '../js/app';

const tmpFolderPath = path.join(__dirname, '../.tmp');

if (!fs.existsSync(tmpFolderPath)) {
  fs.mkdirSync(tmpFolderPath);
}

const indexPage = fs.readFileSync(`${__dirname}/../index.html`);

global.document = require('jsdom').jsdom(indexPage);
global.window = document.defaultView;
global.navigator = window.navigator = {};
global.$ = require('jquery')(window);

let getServerUrl;

before(function () {
  // Most models and many templates depend on getServerUrl which
  // depends on localStorage, which is not available to us in the
  // test environement. So... to work around that, we're stubbing
  // getServerUrl.
  getServerUrl = sinon.stub(app, 'getServerUrl',
    (urlFrag) => `http://localhost:8080/ob/${urlFrag}`);
});

after(function () {
  getServerUrl.restore();
});
