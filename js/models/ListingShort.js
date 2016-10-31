import _ from 'underscore';
import app from '../app';
import BaseModel from './BaseModel';

export default class extends BaseModel {
  // todo: unit testify me
  get shipsFreeToMe() {
    const countries = [];

    app.settings.get('shippingAddresses')
      .forEach(shipAddr => {
        const country = shipAddr.get('country');
        if (country) countries.push(country);
      });

    const country = app.settings.get('country');
    if (country) countries.push(country);

    // countries may have dupes, but it's no bother for this purpose
    return !!_.intersection(this.get('freeShipping'), countries).length;
  }
}
