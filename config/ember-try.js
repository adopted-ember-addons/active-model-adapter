'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = async function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-3.4',
        npm: {
          devDependencies: {
            'ember-source': '~3.4.0',
            'ember-data': '~3.4.0',
          }
        }
      },
      {
        name: 'ember-lts-3.8',
        npm: {
          devDependencies: {
            'ember-source': '~3.8.0',
            'ember-data': '~3.8.0'
          }
        }
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-data': 'emberjs/data#release',
            'ember-source': await getChannelURL('release')
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-data': 'emberjs/data#beta',
            'ember-source': await getChannelURL('beta')
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-data': 'emberjs/data#master',
            'ember-source': await getChannelURL('canary')
          },
        }
      },
      {
        name: 'ember-default',
        npm: {
          devDependencies: {}
        }
      },
      {
        name: 'ember-default-with-jquery',
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'jquery-integration': true
          })
        },
        npm: {
          devDependencies: {
            '@ember/jquery': '^0.5.1'
          }
        }
      }
    ]
  };
};
