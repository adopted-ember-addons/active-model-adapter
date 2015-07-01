/* jshint node: true */
/* global require, module */

var EmberAddon   = require('ember-cli/lib/broccoli/ember-addon');
var merge        = require('broccoli-merge-trees');
var babel        = require('broccoli-babel-transpiler');
var stew         = require('broccoli-stew');
var replace      = require('broccoli-replace');
var concat       = require('broccoli-concat');
var rename       = stew.rename;
var funnel       = require('broccoli-funnel');
var babelOptions = require('./babel-options');
var fs           = require('fs');
var es3          = require('broccoli-es3-safe-recast');
var license      = fs.readFileSync('./lib/license.js').toString();

/*
  This Brocfile specifes the options for the dummy test app of this
  addon, located in `/tests/dummy`

  This Brocfile does *not* influence how the addon or the app using it
  behave. You most likely want to be modifying `./index.js` or app's Brocfile
*/

var app = new EmberAddon();

var addon = funnel('addon');
var addonTree = merge(['addon', 'app']);

var lib = babel('lib', babelOptions);

var bower = funnel('bower_components/loader.js', {include: ['loader.js']});
var compiled = babel(addonTree, babelOptions);
var moved = stew.mv(compiled, 'amd');

var combined = merge([moved, bower, lib]);

var concatted = concat(combined, {
  inputFiles: [
    'loader.js',
    'ember.js',
    'ember-data.js',
    'amd/**/*.js',
    'globals.js'
  ],
  header: license + '\n(function() {\n',
  footer: '\n' +
    'require("globals");\n' +
    '})();\n',
  outputFile: '/active-model-adapter.js'
});

var bower = stew.mv('config', '/');
var bower = stew.find(bower, 'bower.json');

concatted = merge([concatted, bower]);

concatted = replace(concatted, {
  files: ['**/*.{js,json}'],
  patterns: [
    {
      match: /VERSION_STRING_PLACEHOLDER/g,
      replacement: require('./package').version
    },
    {
      match: /active\-model\-adapter\//g,
      replacement: ''
    }
  ]
});

module.exports = merge([app.toTree(), es3(concatted)]);
