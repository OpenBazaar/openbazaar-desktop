import _ from 'underscore';
import loadTemplate from '../../../utils/loadTemplate';
import app from '../../../app';
import BaseView from '../../baseVw';

export default class extends BaseView {
  constructor(options = {}) {
    if (!options.model) {
      throw new Error('Please provide a model.');
    }

    const opts = {
      listPosition: 1,
      ...options,
    };

    super(opts);
    this.options = opts;

    // Since multiple instances of this view will be rendered, the 'viewId' is a unique id that
    // will prefaced to any id's in the template so they'll be unique.
    this.viewId = _.uniqueId();
  }

  set listPosition(position) {
    if (typeof position !== 'number') {
      throw new Error('Please provide a position as a number');
    }

    const prevPosition = this.options.listPosition;
    const listPosition = this.options.listPosition = position;

    if (listPosition !== prevPosition) {
      this.$headline.text(
        app.polyglot.t('editListing.shippingOptions.optionHeading', { listPosition })
      );
    }
  }

  get listPosition() {
    return this.options.listPosition;
  }

  tagName() {
    return 'section';
  }

  // className() {
  //   return `${super.className()} editListing tabbedModal modalTop`;
  // }

  // events() {
  //   return {
  //     'click .js-scrollLink': 'onScrollLinkClick',
  //     ...super.events(),
  //   };
  // }

  get $headline() {
    return this._$headline || this.$('h1');
  }

  render() {
    loadTemplate('modals/editListing/shippingOption.html', t => {
      this.$el.html(t({
        viewId: this.viewId,
        listPosition: this.options.listPosition,
        ...this.model.toJSON(),
      }));

      this.$selectShipDestination = this.$(`#shipDestinationsSelect_${this.viewId}`);
      this.$placeholderShipDestination = this.$(`#shipDestinationsPlaceholder_${this.viewId}`);

      this.$selectShipDestination.select2({
        multiple: true,
        tags: true,
        // dropdownParent needed to fully hide dropdown
        dropdownParent: this.$(`#shipDestinationsDropdown_${this.viewId}`),
        // This is necessary, see comment in select2 for tags above.
        matcher: () => false,
      }).on('change', () => {
        const regions = this.$selectShipDestination.val();
        this.model.set('regions', regions);
        this.$placeholderShipDestination[
          regions.length ? 'removeClass' : 'addClass'
        ]('emptyOfTags');
      });

      this.$placeholderShipDestination[
        this.$selectShipDestination.val().length ? 'removeClass' : 'addClass'
      ]('emptyOfTags');

      this._$headline = null;
    });

    return this;
  }
}
