import path from 'path';
import fs from 'fs';

const tmpFolderPath = path.join(__dirname, '../../.tmp');

if (!fs.existsSync(tmpFolderPath)) {
  fs.mkdirSync(tmpFolderPath);
}

const indexPage = fs.readFileSync(`${__dirname}/../index.html`);

global.document = require('jsdom').jsdom(indexPage);
global.window = document.defaultView;
global.$ = require('jquery')(window);
