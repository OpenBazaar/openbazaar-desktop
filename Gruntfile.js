const path = require('path');

module.exports = function setup(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    'electron-installer-debian': {
      options: {
        productName: 'OpenBazaar',
        name: 'openbazaar2',
        arch: 'amd64',
        version: '2.0.18p',
        bin: 'openbazaar2',
        maintainer: 'OpenBazaar <project@openbazaar.org>',
        rename(dest) {
          return `${dest}<%= name %>_<%= version %>_<%= arch %>.deb`;
        },
        productDescription: 'Decentralized Peer to Peer Marketplace for Bitcoin',
        lintianOverrides: [
          'changelog-file-missing-in-native-package',
          'executable-not-elf-or-script',
          'extra-license-file',
        ],
        icon: 'imgs/icon.png',
        categories: ['Utility'],
        priority: 'optional',
      },
      'app-with-asar': {
        src: 'temp-linux64/openbazaar-linux-x64/',
        dest: 'build-linux64/',
        rename(dest) {
          return path.join(dest, '<%= name %>_<%= arch %>.deb');
        },
      },
    },
    'create-windows-installer': {
      x32: {
        appDirectory: grunt.option('appdir'),
        outputDirectory: grunt.option('outdir'),
        name: grunt.option('appname'),
        productName: grunt.option('appname'),
        authors: 'OpenBazaar',
        owners: 'OpenBazaar',
        exe: `${grunt.option('appname')}.exe`,
        description: `${grunt.option('appname')}`,
        version: grunt.option('obversion') || '',
        title: 'OpenBazaar',
        iconUrl: 'https://www.openbazaar.org/wp-content/uploads/2017/07/windows-icon.ico',
        setupIcon: 'imgs/windows-icon.ico',
        skipUpdateIcon: true,
        loadingGif: 'imgs/windows-loading.gif',
        noMsi: true,
      },
    },
  });
  grunt.loadNpmTasks('grunt-electron-installer-debian');
  grunt.loadNpmTasks('grunt-electron-installer');
  // Default task(s).
  grunt.registerTask('default', ['electron-installer-debian']);
};
