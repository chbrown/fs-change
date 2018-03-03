#!/usr/bin/env node
var _ = require('underscore');
var logger = require('winston');

var config = require('../config');
var FileWatcher = require('../FileWatcher');

if (process.env.OSX) {
  var NotificationCenterTransport = require('winston-notification-center');
  logger.add(NotificationCenterTransport, {title: 'File system watcher'});
}

logger.level = process.env.DEBUG ? 'debug' : 'info';

var config_filepath = (process.env.CONFIG || '~/.fs-change').replace(/^~/, process.env.HOME);

var file_watchers = [];
function restart() {
  logger.debug('Stopping %d FileWatchers', file_watchers.length);
  _.invoke(file_watchers, 'stop');
  file_watchers.length = 0;
  config.loadFileWatchers(config_filepath, function(err, new_file_watchers) {
    if (err) {
      logger.error('Error reading config file: %s', err);
      process.exit(1);
    }

    Array.prototype.push.apply(file_watchers, new_file_watchers);

    logger.debug('Starting %d FileWatchers', file_watchers.length);
    _.invoke(file_watchers, 'start');
  });
}

var config_watcher = new FileWatcher(config_filepath, 2000, restart);
config_watcher.start();
restart();
