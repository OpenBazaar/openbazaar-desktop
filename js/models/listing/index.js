import { Events } from 'backbone';

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
