import BaseVw from './baseVw';

export default class extends BaseVw {
  className() {
    return 'txUnl tx4 clrT clrBr fadeInContent';
  }

  tagName() {
    return 'p';
  }

  events() {
    return {
      'click .js-cancel': 'onCancelClick',
    };
  }

  onCancelClick() {
    this.trigger('clickCancel');
  }

  render() {
    super.render();
    this.$el.html(this.getState().msg || '');
    this.delegateEvents();
    return this;
  }
}
