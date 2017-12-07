# OpenBazaar Client v2

This is the refrence client for the OpenBazaar network. It is an interface for your OpenBazaar node, to use it you will need to run an [OpenBazaar node](https://github.com/OpenBazaar/openbazaar-go) either locally or on a remote server.

For full installable versions of the OpenBazaar app, with the server and client bundled together, go to [the OpenBazaar download page.](https://www.openbazaar.org/download/)

[![Build Status](https://travis-ci.org/OpenBazaar/openbazaar-desktop.svg)](https://travis-ci.org/OpenBazaar/openbazaar-desktop)

## Getting Started

To create a local development copy of the reference client, clone the client repository into a directory of your choice:
- `git clone https://github.com/OpenBazaar/openbazaar-desktop`

Make sure you have Node.js 8.9.2 and NPM 5.5.1 installed.

This client uses Babel to compile [ES6 JavaScript](https://github.com/lukehoban/es6features). You should be familiar with ES6 before modifying its code.

### Installation

1. Navigate to the directory you cloned the repo into.
2. Enter `npm install`

### Running

`npm start` will:
- compile your Sass / re-compile on changes
- run BrowserSync in watch mode so the app automatically refreshes on JS and HTML changes and dynamically injects any CSS / Sass changes**.
- launch the Electron app

** At this time, the app will not refresh on main.js (or other root folder JS changes). This would require the entire Electron app to refresh and BrowserSync is only refreshing our browser.

### Linting

`npm run lint` will run eslint on the JS files.

`npm run lint:watch` will run eslint on any JS file changes.

### Testing

`npm run test` will execute test files in the test folder.

`npm run test:watch` will execute the tests on any file changes.


## Built With

* [Electron](https://electron.atom.io/)
* [Backbone](http://backbonejs.org/)
* [Babel](https://babeljs.io/)

## Contributing

We welcome contributions to the reference client. The best way to get started is to look for an issue with the [Help Wanted label](https://github.com/OpenBazaar/openbazaar-desktop/labels/help%20wanted).

You can also look for issues with the [bug label](https://github.com/OpenBazaar/openbazaar-desktop/labels/bug). These are confirmed bugs that need to be fixed.

Contributions are expected to match the coding style already present in this repo, and must pass es-lint with no errors.

Constributions that make visual changes are also expected to match the repo's current style.

## License
This project is licensed under the MIT License. You can view [LICENSE.MD](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/LICENSE) for more details.

