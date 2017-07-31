import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import BaseVw from '../baseVw';

export default class extends BaseVw {
  constructor(options = {}) {
    const opts = {
      initialState: {
        ...options.initialState || {},
      },
      ...options,
    };

    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(opts);
    this.options = opts;
  }

  className() {
    return 'notification';
  }

  events() {
    return {
      'click [data-route]': 'onClickRoute',
    };
  }

  onClickRoute(e) {
    const $target = $(e.target);

    // If a link within a notification was clicked, we'll do nothing and let
    // the href of that anchor drive what happens.
    if ($target.attr('href')) return;

    location.hash = $target.closest('[data-route]', e.delegateTarget)
      .attr('data-route');
    this.trigger('navigate');
  }

  render() {
    super.render();

    loadTemplate('notifications/notification.html', (t) => {
      this.$el.html(t({
        ...this.getState(),
        ...this.model.toJSON(),
        ownGuid: app.profile.id,
      }));
    });

    return this;
  }
}
