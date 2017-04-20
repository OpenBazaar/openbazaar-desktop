import app from '../../app';
import MiniProfile from '../MiniProfile';
import baseVw from '../baseVw';
import loadTemplate from '../../utils/loadTemplate';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
  }

  render() {
    loadTemplate('transactions/transactions.html', (t) => {
      this.$el.html(t({
        tab: this.options.tab || '',
      }));
    });

    if (this.miniProfile) this.miniProfile.remove();
    this.miniProfile = this.createChild(MiniProfile, {
      model: app.profile,
    });
    this.$('.js-miniProfileContainer').html(this.miniProfile.render().el);

    return this;
  }
}
