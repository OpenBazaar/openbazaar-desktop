import BaseVw from '../baseVw';
import userShort from '../userShort';
import app from '../../app';
import Follows from '../../collections/UsersShort';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.followType = options.followType;

    if (!options.ownPage) {
      this.followCol = new Follows(null, {
        type: this.followType.toLowerCase(),
        guid: this.model.id,
      });
      this.followCol.fetch().done(() => {
        this.folRender();
      });
    } else {
      this.followCol = app[`own${this.followType}`];
      this.folRender();
    }

    this.listenTo(this.followCol, 'sync, update', () => {
      this.folRender();
    });
  }

  className() {
    return 'userPageFollow flexRow';
  }

  folRender() {
    this.$el.empty();
    if (this.followCol.length) {
      this.followCol.forEach((follow) => {
        const user = this.createChild(userShort, {
          model: follow,
        });
        this.$el.append(user.render().$el);
      });
    } else {
      const noneString = app.polyglot.t(
        `userPage.no${this.options.ownPage ? 'Own' : ''}${this.followType}`,
        { name: this.model.get('name') });
      this.$el.append(`<h3 class="flexExpand txCtr">${noneString}</h3>`);
    }
    return this;
  }

  render() {
    return this;
  }
}

