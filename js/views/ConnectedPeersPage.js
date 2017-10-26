import baseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import userShort from './UserCard';
import $ from 'jquery';
import 'selectize';
import { getTranslatedCountries } from '../data/countries';
import _ from 'underscore';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    if (!options.peers) {
      throw new Error('Please provide a list of peers');
    }

    this.peers = options.peers;
    this.loadPeersUpTo = 0;
    this.peersIterator = 12;
  }

  className() {
    return 'userPage';
  }

  events() {
    return {
      'click .js-morePeersBtn': 'loadPeers',
    };
  }

  get $peerWrapper() {
    return this._$peerWrapper ||
        (this._$peerWrapper = this.$('.js-peerWrapper'));
  }

  get $morePeers() {
    return this._$morePeers ||
        (this._$morePeers = this.$('.js-morePeers'));
  }

  loadPeers() {
    if (this.peers.length > this.loadPeersUpTo) {
      const docFrag = $(document.createDocumentFragment());
      this.peers.slice(this.loadPeersUpTo, this.loadPeersUpTo + this.peersIterator)
        .forEach((peer) => {
          const user = this.createChild(userShort, {
            guid: peer,
          });
          docFrag.append(user.render().$el);
        });
      this.$peerWrapper.append(docFrag);
      this.loadPeersUpTo += this.peersIterator;
    }

    // check if next set exists
    if (this.peers.length > this.loadPeersUpTo) {
      this.$morePeers.removeClass('hide');
    } else {
      this.$morePeers.addClass('hide');
    }
  }

  render() {
    loadTemplate('connectedPeersPage.html', (t) => {
      this.$el.html(t({
        peers: this.peers,
      }));
    });
    this._$peerWrapper = null;
    this._$morePeers = null;
    this.loadPeers();

    this.$('#testS').selectize({
      // maxItems: null,
      // valueField: 'name',
      // create: false,
      plugins: ['remove_button'],
      delimiter: ',',
      persist: false,
      // options: ['moo', 'shoo', 'chicken'],
      create(input) {
        return {
          value: input,
          text: input,
        };
      },
    });

    let s;
    const getS = () => {
      if (s) return s;
      return this.$('#pickles')[0].selectize;
    };

    const debounced = _.debounce(() => {
      console.timeEnd('someFunction');
    }, 100);

    this.$('#pickles').selectize({
      maxItems: null,
      valueField: 'dataName',
      searchField: ['name', 'dataName'],
      // hideSelected: false,
      options: getTranslatedCountries(),
      render: {
        option: data => {
          return `<div>${data.name}</div>`;
        },
        item: data => {
          // console.log(`the goods are ${this.$('#pickles')[0].value}`);
          return `<div>${data.name}</div>`;
        },
      },
      onItemAdd: (value, $item) => {
        console.time('someFunction');
        try {
          // getS().addItems(getTranslatedCountries().map(c => c.dataName), true);
        } catch(e) {
        }

        debounced();
      },
    });

    return this;
  }
}
