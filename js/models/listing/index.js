import _ from 'underscore';
import app from '../../app';
import { Events } from 'backbone';
import Listing from './Listing';
import ListingShort from './ListingShort';

// This is an event emitter that we will trigger listing events through.
// In many cases it is preferable to binding directly to a Listing model
// because you may not have a reference to the Listing model that has had
// some event happen, even though that model represents the same listing
// (i.e. same slug) as the one you do have a reference to.
//
// The callbacks of the events below will be passed the model that
// triggered the event as well as an options object.
//
// Available events:
// (as of now these only make sense for your own listings)
// - saved: Triggered when a listing is saved. A created flag will
//   be passed into the callback options to indicate whether this was
//   a newly created listing or an update to an existing one.
// - destroying: Called when a model delete process is being initiated.*
// - destroy: Called when a model has been successfully deleted.*
//
// * for destroying & destroy the model passed into the callback may be
//   a Listing or ListingShort model.
const events = {
  ...Events,
};

export { events };

export function shipsFreeToMe(md) {
  if (!(md instanceof Listing || md instanceof ListingShort)) {
    throw new Error('Please provide a model as an instance of a Listing' +
      ' or ListingShort model.');
  }

  const countries = [];

  app.settings.get('shippingAddresses')
    .forEach(shipAddr => {
      const country = shipAddr.get('country');
      if (country) countries.push(country);
    });

  const country = app.settings.get('country');
  if (country) countries.push(country);

  let freeShipping;

  if (md instanceof ListingShort) {
    freeShipping = md.get('freeShipping');
  } else {
    freeShipping = [];

    md.get('shippingOptions')
      .forEach(shipOpt => {
        shipOpt.get('services')
          .forEach(service => {
            const price = service.get('price');

            if (price && price.eq(0)) {
              freeShipping = freeShipping.concat(shipOpt.get('regions'));
            }
          });
      });
  }

  // countries may have dupes, but it's no bother for this purpose
  return freeShipping.includes('ALL') || !!_.intersection(freeShipping, countries).length;
}
