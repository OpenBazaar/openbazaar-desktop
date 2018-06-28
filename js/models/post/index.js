import _ from 'underscore';
import app from '../../app';
import { Events } from 'backbone';
import Post from './Post';

// This is an event emitter that we will trigger post events through.
// In many cases it is preferable to binding directly to a Post model
// because you may not have a reference to the Post model that has had
// some event happen, even though that model represents the same post
// (i.e. same slug) as the one you do have a reference to.
//
// The callbacks of the events below will be passed the model that
// triggered the event as well as an options object.
//
// Available events:
// (as of now these only make sense for your own posts)
// - saved: Triggered when a post is saved. A created flag will
//   be passed into the callback options to indicate whether this was
//   a newly created post or an update to an existing one.
// - destroying: Called when a model delete process is being initiated.*
// - destroy: Called when a model has been successfully deleted.*
//
// * for destroying & destroy the model passed into the callback may be
//   a Post model.
const events = {
  ...Events,
};

export { events };

