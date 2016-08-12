import fs from 'fs';

const indexPage = fs.readFileSync(`${__dirname}/../index.html`);

global.document = require('jsdom').jsdom(indexPage);
global.window = document.defaultView;
global.$ = require('jquery')(window);
