'use strict'; /*jslint es5: true, node: true, indent: 2 */
var _ = require('underscore');
var child_process = require('child_process');
// var winston = require('winston');
// var logger = new winston.Logger({transports: [new winston.transports.Console()]});
var logger = require('winston');
var path = require('path');

var config = require('./lib/config');
var FileWatcher = require('./lib').FileWatcher;


var defaults = exports.defaults = {
  config: path.join(process.env.HOME, '.fs-change'),
  log: path.join(process.env.HOME, 'Library', 'Logs', 'fs-change.log'),
};

var install = exports.install = function() {
  var app_path = path.join(__dirname, 'FSChange.app');
  // command from http://hints.macworld.com/article.php?story=20111226075701552
  var command = "osascript -e 'tell application \"System Events\" " +
      "to make login item at end with properties " +
      "{path:\"" + app_path + "\", hidden:false}'";

  logger.info('Installing app "%s" to System Events', app_path);
  child_process.exec(command, function(err, stdout, stderr) {
    if (err) {
      return logger.error([
        'Install failed: ' + err,
        '  stdout: ' + stdout,
        '  stderr: ' + stderr,
      ].join('\n'));
    }

    logger.info([
      'Installed Successfully.',
      'To uninstall, go to System Preferences -> ',
      '  Users & Groups -> ',
      '  Login Items -> ',
      '  select "FSChange" and click "-".',
    ].join('\n'));
  });
};

exports.run = function(config_filepath, opts) {
  opts = _.extend({logfile: false, osx: false}, opts);
  if (opts.logfile) {
    logger.add(logger.transports.File, {filename: opts.logfile});
  }

  if (opts.osx) {
    var NotificationCenterTransport = require('winston-notification-center');
    logger.add(NotificationCenterTransport, {title: 'File system watcher'});
  }

  var file_watchers = [];
  var restart = function() {
    logger.debug('Stopping %d FileWatchers', file_watchers.length);
    _.invoke(file_watchers, 'stop');
    file_watchers.length = 0;
    config.read(config_filepath, function(err, new_file_watchers) {
      if (err) {
        logger.error('Error reading config: %s', err);
        process.exit(1);
      }

      Array.prototype.push.apply(file_watchers, new_file_watchers);

      logger.debug('Starting %d FileWatchers', file_watchers.length);
      _.invoke(file_watchers, 'start');
    });
  };

  var config_watcher = new FileWatcher(config_filepath, restart, {delay: 2000, autostart: true});
  restart();
};

process.on('uncaughtException', function(err) {
  logger.error(err.stack, {source: 'process.uncaughtException', error: err});
  process.exit(1);
});
