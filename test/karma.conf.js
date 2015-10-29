
module.exports = function(config) {
  config.set({
    basePath: '../',
    frameworks: [
      'mocha',
      'sinon-chai'
    ],

    browsers: ['firefox_custom'],
    client: { mocha: { 'ui': 'tdd' } },

    customLaunchers: {
      firefox_custom: {
        base: 'Firefox',
        prefs: {
          'dom.webcomponents.enabled': true,
          'dom.w3c_touch_events.enabled': 1
        }
      }
    },

    files: [
      'test/setup.js',
      'lib/snap-scroll.js',
      'gaia-picker.js',
      'gaia-picker-time.js',
      'gaia-picker-date.js',
      'test/gaia-picker.js',
      'test/snap-scroll.js',
      'test/gaia-picker-time.js',
      'test/gaia-picker-date.js'
    ]
  });
};
