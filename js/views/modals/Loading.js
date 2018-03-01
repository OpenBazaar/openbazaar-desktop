import { View } from 'backbone';
import BaseModal from './BaseModal';
import loadTemplate from '../../utils/loadTemplate';

export default class extends BaseModal {
  className() {
    return `${super.className()} loadingModal clrP clrT`;
  }

  clearContentView() {
    this._contentView = null;
    this.getCachedEl('.js-content').empty();
  }

  setContentView(contentView) {
    if (!(contentView instanceof View)) {
      throw new Error('The contentView must be provided as a backbone view instance.');
    }

    this._contentView = contentView;
    this.getCachedEl('.js-content').html(contentView.el);
  }

  open(contentView) {
    // Since this modal is used as a single shared instance across the app, the contentView
    // will be cleared on each open so one user of the modal doesn't impose their contentView
    // on another.
    if (!contentView) {
      this.clearContentView();
    } else {
      this.setContentView(contentView);
    }

    return super.open();
  }

  render() {
    loadTemplate('modals/loading.html', (t) => {
      this.$el.html(t({
        ...this._state,
      }));

      super.render();
      if (this._contentView) {
        this.setContentView(this._contentView);
        this._contentView.delegateEvents();
      }
    });

    return this;
  }
}
