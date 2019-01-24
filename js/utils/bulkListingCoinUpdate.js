import $ from 'jquery';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let latestBulkCoinUpdateSave;

export function bulkCoinUpdate(coins) {
  if (!coins || !Array.isArray(coins)) {
    throw new Error('Please provide an array of accepted cryptocurrency codes.');
  }

  // dedupe the list
  const newCoins = [...new Set(coins)];

  latestBulkCoinUpdateSave = $.post({
    url: app.getServerUrl('ob/bulkupdatecurrency'),
    data: JSON.stringify({ currencies: newCoins }),
    dataType: 'json',
  }).done((data) => {
    events.trigger('bulkUpdateDone');
  }).fail((xhr) => {
    const title = 'There was an error or something'; //TODO translate to something good
    const message = xhr.responseJSON && xhr.responseJSON.reason || '';
    openSimpleMessage(title, message);
    events.trigger('bulkUpdateFailed');
  });
}

export function isBulkCoinUpdating() {
  return latestBulkCoinUpdateSave && latestBulkCoinUpdateSave.state() === 'pending';
}
