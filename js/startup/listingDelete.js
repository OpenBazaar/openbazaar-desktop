import app from '../app';
import { events as listingEvents } from '../models/listing';
import Listing from '../models/listing/Listing';
import Dialog from '../views/modals/Dialog';

const getTitle = (model) => (
  // Model might be a Listing or ListingShort instance.
  model instanceof Listing ?
    model.get('listing')
      .get('item')
      .get('title') :
    model.get('title')
);

export default function () {
  const statusMessages = {};

  listingEvents.on('destroying', (model, opts) => {
    if (statusMessages[opts.slug]) return;

    const statusMessage = app.statusBar.pushMessage({
      msg: `Deleting listing <em>${getTitle(model)}</em>... (translate me)`,
      duration: 99999999999,
    });

    statusMessages[opts.slug] = statusMessage;

    opts.xhr.done(() => {
      statusMessage.update(`Listing <em>${getTitle(model)}</em> deleted. (translate me)`);

      setTimeout(() => (statusMessage.remove()), 3000);
    }).fail((xhr) => {
      const failReason = xhr.responseJSON && xhr.responseJSON.reason || '';

      statusMessage.update({
        msg: `Failed to delete listing <em>${getTitle(model)}</em>. (translate me)`,
        type: 'warning',
      });

      setTimeout(() => (statusMessage.remove()), 3000);

      const failedListingDeleteDialog = new Dialog({
        // title: app.polyglot.t('langChangeRestartTitle'),
        title: 'Unable to delete listing.',
        message: `There was an error deleting listing <em>${getTitle(model)}</em>`
          + `${failReason ? `: ${failReason}</p>` : '</p>'}`,
        buttons: [{
          text: 'ok (translate)',
          fragment: 'ok',
        }],
      }).on('click-ok', () => failedListingDeleteDialog.close())
      .render()
      .open();
    }).always(() => (delete statusMessages[opts.slug]));
  });
}
