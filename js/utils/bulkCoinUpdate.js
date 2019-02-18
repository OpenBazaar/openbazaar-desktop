import $ from 'jquery';
import { Events } from 'backbone';
import { openSimpleMessage } from '../views/modals/SimpleMessage';
import app from '../app';

const events = {
  ...Events,
};

export { events };

let bulkCoinUpdateSave;

export function isBulkCoinUpdating() {
  return bulkCoinUpdateSave && bulkCoinUpdateSave.state() === 'pending';
}

export function bulkCoinUpdate(coins) {
  if (!Array.isArray(coins) || !coins.length) {
    throw new Error('Please provide an array of accepted cryptocurrency codes.');
  }

  // dedupe the list
  const newCoins = [...new Set(coins)];

  if (isBulkCoinUpdating()) {
    throw new Error('An update is in process, new updates must wait until it is finished.');
  } else {
    events.trigger('bulkCoinUpdating');
    bulkCoinUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdatecurrency'),
      data: JSON.stringify({ currencies: newCoins }),
      dataType: 'json',
    }).done(() => {
      events.trigger('bulkCoinUpdateDone');
    }).fail((xhr) => {
      const reason = xhr.responseJSON && xhr.responseJSON.reason || xhr.statusText || '';
      const message = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.errors.errorMessage');
      const title = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.errors.errorTitle');
      const reasonMsg =
        app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.errors.reasonForError', { reason });
      const msg = `${message} ${reason ? `<br>${reasonMsg}` : ''}`;
      openSimpleMessage(title, msg);
      events.trigger('bulkCoinUpdateFailed');
    });
  }

  return bulkCoinUpdateSave;
}
