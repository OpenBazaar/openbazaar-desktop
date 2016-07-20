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

  // Ensure any colors are strings and have a leading hash. This is primarily
  // to standardize client input.
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
    super.set(this.standardizeColorFields(attrs), options);
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

    console.log('yo');

    if (Object.keys(errObj).length) return errObj;

    console.log('mamma');

    return undefined;
  }

  convertColorsToBase10(attrs) {
    const updatedAttrs = { ...attrs };

    this.getColorFields().forEach((field) => {
      if (typeof attrs[field] !== 'undefined') {
        updatedAttrs[field] = parseInt(updatedAttrs[field].slice(1), 16);
      }
    });

    return updatedAttrs;
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    options.attrs = this.convertColorsToBase10(options.attrs);

    if (method === 'read') {
      options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }

  parse(response) {
    const updatedResponse = { ...response };

    // convert any colors from the server into hex format
    this.getColorFields().forEach((field) => {
      const clr = response[field];

      if (typeof clr !== 'undefined') {
        updatedResponse[field] = Number(clr).toString(16);

        while (updatedResponse[field].length < 6) {
          updatedResponse[field] = `0${updatedResponse[field]}`;
        }

        updatedResponse[field] = `#${updatedResponse[field]}`;
      }
    });

    return updatedResponse;
  }
}
