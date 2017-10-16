import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import BaseModal from './BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    super(options);

    this._state = {
      reporting: false,
      ...options.initialState || {},
    };

    if (!options.peerID) throw new Error('You must provide a peerID.');
    if (!options.slug) throw new Error('You must provide a slug.');
    if (!options.url) throw new Error('You must provide a url.');

    this.peerID = options.peerID;
    this.slug = options.slug;
    this.url = options.url;
  }

  className() {
    return `${super.className()} reportModal modalTop modalScrollPage modalNarrow`;
  }

  events() {
    return {
      'click .js-submit': 'onClickSubmit',
      ...super.events(),
    };
  }

  onClickSubmit() {
    const data = {};
    data.peerID = this.peerID;
    data.slug = this.slug;
    data.reason = '';
    $.ajax({
      url: this.url,
      data,
    })
      .done(()=> {
        this.trigger('submitted');
      })
      .fail()
      .always();
  }

  render() {
    console.log('render report')
    loadTemplate('modals/report.html', (t) => {
      this.$el.html(t(this.options));

      super.render();
    });

    return this;
  }
}
