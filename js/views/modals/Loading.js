import { capitalize } from '../../utils/string';
import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      contentHtml: '',
      contentText: '',
      contentClass: '', // only used if providing a contentText
      ...options,
    };

    super(opts);

    this._state = {
      ...opts.initialState || {},
    };
  }

  className() {
    return `${super.className()} loadingModal clrP clrT`;
  }

  events() {
    return {
      'click .js-content [class^="js-"], .js-content [class*=" js-"]': 'onContentClick',
    };
  }

  // TODO TODO HEy Hujohafd asoijdoia soajidiosa
  // User of this view may embed CTA's in the msg. This is a generic handler to
  // trigger events for them.
  onContentClick(e) {
    // If the the el has a '.js-<class>' class, we'll trigger a
    // 'click<Class>' event from this view.
    const events = [];

    e.currentTarget.classList.forEach((className) => {
      if (className.startsWith('js-')) events.push(className.slice(3));
    });

    if (events.length) {
      events.forEach(event => {
        this.trigger(`click${capitalize(event)}`, { view: this, e });
      });
    }
  }

  open(content = {}) {
    const state = {
      contentHtml: '',
      contentText: '',
      contentClass: '',
      ...content,
    };

    // Since this loading modal is being used as a single instance shared by many parts of
    // the app, any content will be cleared each time the modal is opened unless it's explicitly
    // passed into open. This way one "consumer" of the loading modal will not impose their state
    // on the next guy.
    this.setState(state);
    return super.open();
  }

  render() {
    loadTemplate('modals/loading.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));

      super.render();
    });

    return this;
  }
}
