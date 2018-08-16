import $ from 'jquery';
import app from '../../app';
import loadTemplate from '../../utils/loadTemplate';
import baseVw from '../baseVw';
import 'trunk8';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;
    this.title = '';
    this.images = [];
  }

  className() {
    return 'post clrBr';
  }

  events() {
    return {
      'click .js-showMore': 'clickShowMore',
      'click .js-showLess': 'clickShowLess',
    };
  }

  clickShowMore(e) {
    // the show more button is added by the parent view when it applies trunk8 to the text
    const btnTxt = app.polyglot.t('listingDetail.review.showLess');
    $(e.target).parent().trunk8('revert')
      .append(`&nbsp; <button class="btnTxtOnly trunkLink js-showLess">${btnTxt}</button>`);
  }

  clickShowLess(e) {
    $(e.target).parent().trunk8();
  }

  render() {
    loadTemplate('posts/post.html', (t) => {
      this.$el.html(t({
        title: this.title,
        images: this.images,
      }));
    });
    return this;
  }
}

