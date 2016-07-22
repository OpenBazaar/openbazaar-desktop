import loadTemplate from '../../../utils/loadTemplate';
import { View } from 'backbone';
import select2 from 'select2'; // eslint-disable-line no-unused-vars

export default class extends View {
  constructor(options = {}) {
    super({
      className: 'settingsGeneral',
      events: {
      },
      ...options,
    });

    // temp data. This view will need the user model, the languages, the countries, and the
    // currencies.

    this.profileModel = {
      handle: '@example',
      name: 'exampleName',
      location: 'UNITED_STATES',
      about: 'example about',
      shortDescription: 'example short description',
      website: 'http://example.website.com',
      email: 'example@email.com',
      nsfw: false,
      vendor: false,
      moderator: false,
      primaryColor: '',
      secondaryColor: '',
      textColor: '',
      followerCount: 0,
      followingCount: 0,
      listingCount: 0,
    };

    this.countryList = [
      { code: 'USA', dataName: 'UNITED_STATES', name: 'United States' },
      { code: 'DZD', dataName: 'ALGERIA', name: 'Algeria' },
    ];

    this.options = {
      // test data
      countryList: this.countryList,
    };

    this.options = Object.assign({}, options, this.profileModel, this.options);
  }

  save() {
    console.log('saved page');
    // save the form
  }

  cancel() {
    console.log('cancel page');
    // cancel the form
  }

  render() {
    loadTemplate('modals/settings/settingsPage.html', (t) => {
      this.$el.html(t(this.options));
    });

    setTimeout(() => {
      this.$('#settingsLocationSelect').select2();
    }, 0);


    return this;
  }
}

