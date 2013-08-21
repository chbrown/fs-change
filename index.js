'use strict'; /*jslint node: true, es5: true, indent: 2 */
var _ = require('underscore');
var async = require('async');
var child_process = require('child_process');
var fs = require('fs');
var glob = require('glob');
var logger = require('winston');
var path = require('path');

function FileAction(filepath, command_template) {
  this.filepath = filepath;
  // for each file, interpolate its command
  var ctx = {
    file: filepath,
    extname: path.extname(filepath),
    basename: path.basename(filepath, path.extname(filepath)),
    dirname: path.dirname(filepath)
  };
  this.command = command_template.replace(/\{(.+?)\}/g, function(full_match, group_1) {
    return ctx[group_1];
  });
}
FileAction.prototype.start = function() {
  // debounce for a period of 2s, but execute on the immediate end
  this.fs_watcher = fs.watch(this.filepath, _.debounce(this.change.bind(this), 2000, true));
};
FileAction.prototype.stop = function() {
  this.fs_watcher.close();
};
FileAction.prototype.change = function(event, filename) {
  // filename may not actually be supplied
  logger.verbose('Saw ' + event + ' on ' + this.filepath);
  // TODO: check last modified stats?
  // if (curr.mtime.valueOf() != prev.mtime.valueOf() ||
  //   curr.ctime.valueOf() != prev.ctime.valueOf()) {
  logger.info(this.command);
  child_process.exec(this.command, function (err, stdout, stderr) {
    if (err) logger.error(err);
    if (stdout) logger.debug('stdout: ' + stdout);
    if (stderr) logger.debug('stderr: ' + stdout);
  });
};

function readConfig(config_path, callback) {
  // callback signature: function(err, files) - files is an Array of FileAction objects
  logger.info('Reading config: ' + config_path);
  fs.readFile(config_path, 'utf8', function (err, data) {
    if (err) return callback(err);

    var lines = data.trim().split(/\n+/g);
    logger.debug('Globbing ' + lines.length + ' patterns');

    // we have a bunch of globs, we want to flatmap them all to a list of filepaths
    async.map(lines, function(line, callback) {
      var parts = line.match(/^(.+?):(.+)$/);
      var pattern = parts[1].trim();
      var command = parts[2].trim();
      glob(pattern, function(err, filepaths) {
        // for single files, filepaths will just be one file: the exact match
        callback(err, filepaths.map(function(filepath) {
          // zip up each filepath with the command that goes with its glob
          return new FileAction(filepath, command);
        }));
      });
    }, function(err, fileactionss) {
      var fileactions = _.flatten(fileactionss);
      logger.debug('Created ' + fileactions.length + ' FileActions');
      callback(err, fileactions);
    });
  });
}

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

  child_process.exec(command, function (error, stdout, stderr) {
    if (error) {
      logger.error([
        'Install failed: ' + error,
        '  stdout: ' + stdout,
        '  stderr: ' + stderr,
      ].join('\n'));
    }
    else {
      logger.info([
        'Installed Successfully.',
        'To uninstall, go to System Preferences -> ',
        '  Users & Groups -> ',
        '  Login Items -> ',
        '  select "FSChange" and click "-".',
      ].join('\n'));
    }
  });
};

function loop(config) {
  readConfig(config, function(err, file_actions) {
    if (err) {
      logger.error(err.toString());
      process.exit(1);
    }
    else {
      _.invoke(file_actions, 'start');
      // file_actions.forEach(function(file_action) {
      //   file_action.start();
      // });
      var config_watcher = fs.watch(config);
      var restart = function(event) {
        logger.info('Config ' + event + 'd: ' + config);
        logger.info('Stopping ' + file_actions.length + ' watchers');
        _.invoke(file_actions, 'stop');
        // file_actions.forEach(function(file_action) { file_action.close(); });

        loop(config);
      };
      config_watcher.on('change', _.debounce(restart, 2000, true));
    }
  });
}

var watch = exports.watch = function(config, log, osx) {
  if (log) {
    logger.add(logger.transports.File, {filename: log});
  }

  if (osx) {
    var NotificationCenterTransport = require('winston-notification-center');
    logger.add(NotificationCenterTransport, {title: 'File system watcher'});
  }

  loop(config);
};

process.on('uncaughtException', function(err) {
  logger.error(err.stack);
  process.exit(1);
});
