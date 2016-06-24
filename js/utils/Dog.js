export default class Dog {
  constructor(name) {
    if (!name) {
      throw new Error('What type of dog doesn\'t have a name!');
    }

    this.name = name;
  }
}
