import { recordEvent } from '../../utils/metrics';
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
    recordEvent('Chat_ConversationOpen');
    this.trigger('click', { view: this });
  }

  render() {
    let templateData = {
      ...this.model.toJSON(),
      lastMessage: this.model.get('lastMessage'),
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
