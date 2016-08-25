const fs = require('fs');
const indexIn = `${__dirname}/../index.html`;
const indexOut = `${__dirname}/../.tmp/index.html`;
let indexHtml;

try {
  indexHtml = fs.readFileSync(indexIn);
} catch (e) {
  throw new Error(`Unable to read ${indexIn}. ${e}`);
}

try {
  const content = String(indexHtml)
    .replace('<!-- BROWSER_SYNC_PLACEHOLDER (DO NOT REMOVE OR ALTER!) -->', '')
    .replace('// install babel hooks in the renderer process', '')
    .replace('require(\'babel-register\');', '')
    .replace('require(\'../js/start\')', 'require(\'../dist/start\')');
  fs.writeFileSync(indexOut, content);
} catch (e) {
  throw new Error(`Unable to write to ${indexOut}. ${e}`);
}
