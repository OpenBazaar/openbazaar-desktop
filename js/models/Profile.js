import { Model } from 'backbone';
import app from '../app';
import is from 'is_js';

export default class extends Model {
  // constructor(options = {}) {
  //   super({
  //     idAttribute: 'guid',
  //     ...options,
  //   });
  // }

  defaults() {
    return {
      primaryColor: '#086A9E',
      secondaryColor: '#317DB8',
      textColor: '#ffffff',
    };
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  getColorFields() {
    return [
      'primaryColor',
      'secondaryColor',
      'textColor',
    ];
  }

  // Ensure any colors are strings and have a leading hash.
  standardizeColorFields(attrs = {}) {
    const updatedAttrs = { ...attrs };

    this.getColorFields().forEach((field) => {
      if (typeof attrs[field] !== 'undefined') {
        updatedAttrs[field] = updatedAttrs[field].toString();
        updatedAttrs[field] = updatedAttrs[field].charAt(0) !== '#' ?
          `#${updatedAttrs[field]}` : updatedAttrs[field];
      }
    });

    return updatedAttrs;
  }

  set(attrs, options) {
    return super.set(this.standardizeColorFields(attrs), options);
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const colorFields = this.getColorFields();

    colorFields.forEach((colorField) => {
      const clr = attrs[colorField];

      if (typeof clr !== 'undefined' && is.not.hexColor(clr)) {
        addError(colorField, 'Please provide a valid hex color.');
      }
    });

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    if (method === 'read') {
      options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }
}
