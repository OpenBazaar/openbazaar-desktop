const fs = require('fs');
const pp = require('preprocess');

const indexIn = `${__dirname}/../index.html`;
const indexOut = `${__dirname}/../.tmp/index.html`;
const browserSyncClient = `${__dirname}/../node_modules/browser-sync-client/dist/index.min.js`;
let bsClientScript;
let indexHtml;

try {
  bsClientScript = fs.readFileSync(browserSyncClient);
} catch (e) {
  throw new Error(`Unable to read the browser-sync client script at ${browserSyncClient}. ${e}`);
}

try {
  indexHtml = fs.readFileSync(indexIn);

  try {
    fs.writeFileSync(indexOut,
      pp.preprocess(indexHtml, { bsClientScript, NODE_ENV: process.env.NODE_ENV }));
  } catch (e) {
    throw new Error(`Unable to write to ${indexOut}. ${e}`);
  }
} catch (e) {
  throw new Error(`Unable to read ${indexIn}. ${e}`);
}
