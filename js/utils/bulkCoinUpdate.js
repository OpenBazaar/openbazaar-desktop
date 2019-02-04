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
  if (!Array.isArray(coins)) {
    throw new Error('Please provide an array of accepted cryptocurrency codes.');
  }

  // dedupe the list
  const newCoins = [...new Set(coins)];

  if (!bulkCoinUpdateSave || !isBulkCoinUpdating()) {
    events.trigger('bulkUpdateStarted');
    bulkCoinUpdateSave = $.post({
      url: app.getServerUrl('ob/bulkupdatecurrency'),
      data: JSON.stringify({ currencies: newCoins }),
      dataType: 'json',
    }).done(() => {
      events.trigger('bulkUpdateDone');
    }).fail((xhr) => {
      const title = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.ErrorTitle');
      const reason = xhr.responseJSON && xhr.responseJSON.reason || '';
      const message = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.ErrorMessage');
      const msg = `${message} ${reason ? `\n\n${reason}` : ''}`;
      openSimpleMessage(title, msg);
      events.trigger('bulkUpdateFailed');
    });
  } else {
    const title = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.ErrorTitle');
    const msg = app.polyglot.t('settings.storeTab.bulkListingCoinUpdate.InProgressError');
    openSimpleMessage(title, msg);
    events.trigger('bulkUpdateFailed');
  }

  return bulkCoinUpdateSave;
}
