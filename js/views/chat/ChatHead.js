import $ from 'jquery';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    super(options);
    this.profile = options.profile;

    this.listenTo(this.model, 'change', this.render);
  }

  className() {
    return 'chatHead';
  }

  events() {
    return {
      click: 'onClick',
    };
  }

  onClick() {
    this.trigger('click', { view: this });
  }

  render() {
    const message = this.model.get('lastMessage');

    // Give any links the emphasis color.
    const $msgHtml = $(`<div>${message}</div>`);

    $msgHtml.find('a')
      .addClass('clrTEm');

    let templateData = {
      ...this.model.toJSON(),
      lastMessage: $msgHtml.html(),
    };

    if (this.profile) {
      templateData = {
        ...templateData,
        ...this.profile.toJSON(),
      };
    }

    loadTemplate('chat/chatHead.html', (t) => {
      this.$el.html(t(templateData));
    });

    return this;
  }
}
