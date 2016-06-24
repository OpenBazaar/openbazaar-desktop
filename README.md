#OpenBazaar Client v2

[![Build Status](https://travis-ci.org/OpenBazaar/openbazaar-desktop.svg)](https://travis-ci.org/OpenBazaar/openbazaar-desktop)

Installation
------------

1. Clone the client repository into a directory of your choice:
  - `git clone git@github.com:OpenBazaar/openbazaar-desktop.git`
2. Navigate into the new folder created in (1)
  - `cd openbazaar-desktop`
3. `npm install`

Running
-------

`npm start` will:
- compile your Sass / re-compile on changes
- run BrowserSync in watch mode so the app automatically refreshes on JS and HTML changes and dynamically injects any CSS / Sass changes.
- launch the Electron app

Linting
-------
`npm run lint` will run eslint on the JS files.

`npm run lint:watch` will run eslint on any JS file changes.

_If contributing, PR's with linting errors will not be merged._