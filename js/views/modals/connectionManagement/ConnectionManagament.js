import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';

export default class extends BaseModal {
  constructor(options = {}) {
    const opts = {
      // debugLog: remote.getGlobal('serverLog'),
      // autoUpdate: true,
      ...options,
    };

    super(opts);
    this.options = opts;
    console.log('skippy');
    window.skippy = this;
  }

  className() {
    return `${super.className()} modalTewrewop mfffodalScrollPage`;
  }

  events() {
    return {
      'click .js-sanity': 'howdyClick',
      ...super.events(),
    };
  }

  howdyClick() {
    console.log('charlie says mariah mariah aroo.');
  }

  render() {
    loadTemplate('modals/connectionManagement/connectionManagement.html', t => {
      this.$el.html(t());
      super.render();
    });

    return this;
  }
}
