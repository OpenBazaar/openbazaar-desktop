import
  serverConnect,
  { getCurrentConnection, events as serverConnectEvents } from '../../../utils/serverConnect';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';
import Configuration from './Configuration';

export default class extends baseVw {
  constructor(options = {}) {
    if (!options.collection) {
      throw new Error('Please provide a server configurations collection.');
    }

    super(options);
    this.configViews = [];

    this.listenTo(serverConnectEvents, 'all', (eventName, eventData) => {
      console.log(`gotta ${eventName} event wit sum data`);
      window.data = eventData;
    });

    this.listenTo(serverConnectEvents, 'connecting', e => {
      this.configViews.forEach(configVw => {
        if (configVw.model.id === e.server.id) {
          configVw.setState({ status: 'connecting' });
        } else {
          configVw.setState({ status: 'not-connected' });
        }
      });
    });

    this.listenTo(serverConnectEvents, 'connect-attempt-failed', e => {
      this.getConfigVw(e.server.id)
        .setState({ status: 'connect-attempt-failed' });
    });
  }

  className() {
    return 'configurations';
  }

  events() {
    return {
      'click .js-btnNew': 'onNewClick',
    };
  }

  onNewClick() {
    this.trigger('newClick');
  }

  onConfigConnectClick(e) {
    serverConnect(this.collection.at(this.configViews.indexOf(e.view)));
  }

  getConfigVw(id) {
    return this.configViews.filter(configVw => configVw.model.id === id)[0];
  }

  createConfigView(options = {}) {
    const opts = {
      ...options,
    };

    const curConn = getCurrentConnection();

    if (curConn && curConn.server.id === opts.model.id) {
      opts.initialState = {
        status: curConn.status,
        ...opts.initialState,
      };
    }

    const configVw = this.createChild(Configuration, opts);
    this.listenTo(configVw, 'connectClick', this.onConfigConnectClick);
    return configVw;
  }

  render() {
    loadTemplate('modals/connectionManagement/configurations.html', (t) => {
      this.$el.html(t());

      this.configViews.forEach(configVw => configVw.remove());
      this.configViews = [];

      const configContainer = document.createDocumentFragment();
      this.collection.forEach(md => {
        const configVw = this.createConfigView({ model: md });
        this.configViews.push(configVw);
        configContainer.appendChild(configVw.render().el);
      });

      this.$('.js-serverConfigsContainer').html(configContainer);
    });

    return this;
  }
}
