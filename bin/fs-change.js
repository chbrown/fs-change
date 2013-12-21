#!/usr/bin/env node
'use strict'; /*jslint node: true, es5: true, indent: 2 */
var path = require('path');
var logger = require('winston');
var _ = require('underscore');

var fs_change = require('..');

var optimist = require('optimist')
  .usage([
    'Usage: fs-change [options]',
    '   or: fs-change install',
  ].join('\n'))
  .describe({
    config: 'configuration file',
    log: 'log file',
    osx: 'use the notification center',
    help: 'print this help message',
    verbose: 'print extra output',
    version: 'print version',
  })
  .demand(['config'])
  .boolean(['help', 'verbose', 'version', 'osx'])
  .alias({verbose: 'v'})
  .default(fs_change.defaults);

var argv = optimist.argv;
logger.level = argv.verbose ? 'debug' : 'info';

if (argv.help) {
  optimist.showHelp();
}
else if (argv.version) {
  console.log(require('../package').version);
}
else if (argv._.length && argv._[0] == 'install') {
  fs_change.install();
}
else {
  fs_change.run(argv.config, {logfile: argv.log, osx: argv.osx});
}
