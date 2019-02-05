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

function showError(opts) {
  events.trigger('bulkCoinUpdateFailed');
  const title = opts.title || app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.ErrorTitle');
  const msg = opts.msg || app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.ErrorMessage');
  openSimpleMessage(title, msg);
}

export function bulkCoinUpdate(coins) {
  if (!Array.isArray(coins)) {
    throw new Error('Please provide an array of accepted cryptocurrency codes.');
  }

  // dedupe the list
  const newCoins = [...new Set(coins)];

  if (!newCoins.length) {
    showError({ msg: app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.NoCoinsError') });
  } else if (isBulkCoinUpdating()) {
    showError({ msg: app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.InProgressError') });
  } else {
    events.trigger('bulkCoinUpdateStarted');
    bulkCoinUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdatecurrency'),
      data: JSON.stringify({ currencies: newCoins }),
      dataType: 'json',
    }).done(() => {
      events.trigger('bulkCoinUpdateDone');
    }).fail((xhr) => {
      const reason = xhr.responseJSON && xhr.responseJSON.reason || xhr.statusText || '';
      const message = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.ErrorMessage');
      showError({ msg: `${message} ${reason ? `\n\n${reason}` : ''}` });
    });
  }

  return bulkCoinUpdateSave;
}
