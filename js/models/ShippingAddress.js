import BaseModel from './BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      Name: '',
      Company: '',
      AddressLineOne: '',
      AddressLineTwo: '',
      City: '',
      State: '',
      Country: '',
      PostalCode: '',
    };
  }
}
