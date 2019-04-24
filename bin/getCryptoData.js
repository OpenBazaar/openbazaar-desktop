import path from 'path';
import fetch from 'node-fetch';
import Promise from 'bluebird';
import fs from 'fs';
import jsonformat from 'json-format';
import draftLog from 'draftlog';

const iconOutputPath = `${__dirname}${path.sep}..${path.sep}imgs${path.sep}cryptoIcons${path.sep}/`;
const translationFile = `${__dirname}${path.sep}..${path.sep}js${path.sep}` +
  `languages${path.sep}/en_US.json`;

draftLog(console);

let whitelist = {};

/*
 * The whitelist is obtained from the ticker. It is a mapping of currency code
 * to CMC id. In the event of duplicate crypto currency codes the CMC id listed in
 * the whitelist will be used. For dupes not listed, the first one in the results
 * set obtained from CMC will be used (which is likely the one that was
 * listed with CMC the longest).
 */
function getWhitelist() {
  return new Promise((resolve, reject) => {
    fetch('https://ticker.openbazaar.org/whitelist')
      .then(res => resolve(res.json()))
      .catch(err => reject(err));
  });
}

function getCoinList() {
  return new Promise((resolve, reject) => {
    fetch('https://api.coinmarketcap.com/v2/listings/')
      .then(res => resolve(res.json()))
      .catch(err => reject(err));
  });
}

function getIconUrl(id) {
  if (!id) {
    throw new Error('Please provide an id.');
  }

  return `https://s2.coinmarketcap.com/static/img/coins/128x128/${id}.png`;
}

function logError(msg = '') {
  console.error(`\x1b[31m${msg}\x1b[0m`);
}

let iconsWritten = 0;
let totalCoins;
const draft = console.draft();

function setIconsWritten(count) {
  if (typeof count !== 'number') {
    throw new Error('Please provide a numeric count.');
  }

  if (count !== iconsWritten) {
    iconsWritten = count;
    draft(`Obtained ${count}/${typeof totalCoins === 'number' ? totalCoins : '?'}` +
      ' icons.');
  }
}

function getIcon(coin) {
  if (typeof coin !== 'object') {
    throw new Error('Please provide a coin object.');
  }

  if (whitelist[coin.symbol] && whitelist[coin.symbol] !== coin.id) return;

  fetch(getIconUrl(coin.id))
    .then(res => {
      const writeStream =
        fs.createWriteStream(`${iconOutputPath}${path.sep}${coin.symbol}-icon.png`);
      writeStream.on('error', err => {
        logError(`There was an error writing the icon for symbol ${coin.symbol},` +
          ` with an id of ${coin.id}: ${err}`);
      });
      writeStream.on('finish', () => setIconsWritten(iconsWritten + 1));
      res.body.pipe(writeStream);
    })
    .catch(err => {
      if (err.type === 'system') {
        logError(`There was an error fetching the icon for symbol ${coin.symbol},` +
          ` with an id of ${coin.id}: ${err.message}`);
      } else {
        logError(err);
      }
    });
}

console.log('Obtaining whitelist...');

getWhitelist()
  .then(
    wl => {
      whitelist = wl;
      console.log('Whitelist obtained...');
      draft('Obtaining crypto icons...');

      getCoinList()
        .then(results => {
          // remove duplicates from the data set using our whitelist
          const newList = [];
          const indexedNewList = {};
          results.data.forEach(c => {
            if (
              !(whitelist[c.symbol] && whitelist[c.symbol] !== c.id) &&
              !indexedNewList[c.symbol]
            ) {
              newList.push(c);
              indexedNewList[c.symbol] = c;
            }
          });
          totalCoins = newList.length;
          results.data = newList;

          results.data.sort((a, b) => {
            if (a.symbol < b.symbol) {
              return -1;
            }
            if (a.symbol > b.symbol) {
              return 1;
            }

            return 0;
          });

          const callGetIcon = (index = 0) => {
            getIcon(results.data[index]);
            if (index + 1 < results.data.length) {
              // Give some space between requests, otherwise kicking off so many at once
              // leads to many of them failing.
              setTimeout(() => callGetIcon(index + 1), 50);
            }
          };

          if (results.data.length) {
            callGetIcon();
            console.log('Updating the en_US.json translation file...');
            fs.readFile(translationFile, (err, data) => {
              if (err) {
                logError(`There was an error processing the translation file: ${err}`);
                return;
              }

              const parsed = JSON.parse(data);

              results.data.forEach(c => {
                if (whitelist[c.symbol] && whitelist[c.symbol] !== c.id) return;
                parsed.cryptoCurrencies[c.symbol] = c.name;
              });

              const sortedCryptoCurs = {};
              Object.keys(parsed.cryptoCurrencies)
                .sort()
                .forEach(key => (sortedCryptoCurs[key] = parsed.cryptoCurrencies[key]));
              parsed.cryptoCurrencies = sortedCryptoCurs;

              const jsonConfig = {
                type: 'space',
                size: 2,
              };

              fs.writeFile(translationFile, jsonformat(parsed, jsonConfig), writeErr => {
                if (err) {
                  logError(`There was an error writing the translation file: ${writeErr}`);
                  return;
                }

                console.log(`Successfully wrote to ${translationFile}`);
              });
            });
          }
        })
        .catch(err => {
          if (err.type === 'system') {
            logError(`There was an error fetching the coin list: ${err}`);
          } else {
            logError(err);
          }
        });
    },
    err => logError(`There was an error fetching the coin list: ${err}`)
  );

