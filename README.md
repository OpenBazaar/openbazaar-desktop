# OpenBazaar Client v2

[![Build Status](https://travis-ci.org/OpenBazaar/openbazaar-desktop.svg)](https://travis-ci.org/OpenBazaar/openbazaar-desktop)

Installation
------------

1. Clone the client repository into a directory of your choice:
  - `git clone https://github.com/phoreproject/openbazaar-desktop`
2. Navigate into the new folder created in (1)
  - `cd openbazaar-desktop`
3. `npm install`

Running
-------

`npm start` will:
- compile your Sass / re-compile on changes
- run BrowserSync in watch mode so the app automatically refreshes on JS and HTML changes and dynamically injects any CSS / Sass changes**.
- launch the Electron app

** At this time, the app will not refresh on main.js (or other root folder JS changes). This would require the entire Electron app to refresh and BrowserSync is only refreshing our browser.

Linting
-------
`npm run lint` will run eslint on the JS files.

`npm run lint:watch` will run eslint on any JS file changes.

Testing
-------
`npm run test` will execute test files in the test folder.

`npm run test:watch` will execute the tests on any file changes.
