/*jslint node: true */
var _ = require('underscore');
var async = require('async');
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var logger = require('winston');

var FileWatcher = require('./FileWatcher');

function wrapExec(command) {
  return function() {
    logger.info('$ %s', command);
    child_process.exec(command, function(err, stdout, stderr) {
      if (err) logger.error('child_process.exec error', err);
      if (stdout) logger.info('stdout: %s', stdout);
      if (stderr) logger.info('stderr: %s', stderr);
    });
  };
}

function parseConfig(file_contents) {
  // sync config parsing, return list of {glob: String, template: String} hashes
  var macros = [];
  var glob_templates = [];

  var lines = file_contents.split(/\n/g);

  logger.debug('Parsing config file (%d lines)', lines.length);
  lines.forEach(function(line, callback) {
    // macros look like:
    // & /regex/flags => substition
    var macro_match = line.match(/^& \/([^\/]+)\/(\w*) => (.+)$/);
    if (macro_match) {
      var macro = {
        regex: new RegExp(macro_match[1], macro_match[2]),
        replacement: macro_match[3]
      };
      logger.debug('Adding macro: %s => %s', macro.regex, macro.replacement);
      macros.push(macro);
    }
    else {
      // apply all macros immediately, before parsing, to the entire raw line
      macros.forEach(function(macro) {
        line = line.replace(macro.regex, macro.replacement);
      });

      // comments look like
      // #...
      if (line.match(/^#(.*)$/)) {
        logger.debug('Ignoring comment: "%s"', line);
      }
      else {
        // glob-templates look like
        // /path/to/file/or/glob/*.js: template
        var glob_template_match = line.match(/^([^:]+)\s*:\s*(.+)$/);
        if (glob_template_match) {
          var glob_template = {
            glob: glob_template_match[1],
            template: glob_template_match[2]
          };
          logger.debug('Adding glob-template: %s => %s', glob_template.glob, glob_template.template);
          glob_templates.push(glob_template);
        }
        else if (line.match(/\S+/)) {
          logger.error('Could not parse config line: "%s"', line);
        }
        // completely ignore whitespace-only lines
      }
    }
  });
  return glob_templates;
}

/** config.loadFileWatchers(config_filepath: string,
                            callback(error: Error, file_watchers: FileWatcher[]))

Read the watch file config from config_filepath, parse it, and return a list of
inactive FileWatchers.
*/
exports.loadFileWatchers = function(config_filepath, callback) {
  logger.info('Reading config: %s', config_filepath);
  fs.readFile(config_filepath, {encoding: 'utf8'}, function(err, data) {
    if (err) return callback(err);

    // parse config file synchronously, applying macros but not expanding any globs
    var glob_templates = parseConfig(data);

    // now we have a bunch of (glob, command_template) pairs, we want to
    // flatmap them all to a list of file-actions by expanding the globs
    async.map(glob_templates, function(glob_template, callback) {
      // callback signature: (err, {filepath: String, template: String})
      // for single files, filepaths will just be one file: the exact match of `pattern`
      glob(glob_template.glob, function(err, filepaths) {
        if (err) return callback(err);
        // keep things simple: don't interpolate yet (since interpolation is sync)
        var filepath_templates = filepaths.map(function(filepath) {
          return {filepath: filepath, template: glob_template.template};
        });
        callback(null, filepath_templates);
      });
    }, function(err, filepath_templates) {
      if (err) return callback(err);

      var file_watchers = _.flatten(filepath_templates).map(function(filepath_template) {
        // for each file, interpolate its command
        var filepath = filepath_template.filepath;
        var ctx = {
          file: filepath,
          extname: path.extname(filepath),
          basename: path.basename(filepath, path.extname(filepath)),
          dirname: path.dirname(filepath)
        };
        var command = filepath_template.template.replace(/\{(.+?)\}/g, function(full_match, group_1) {
          // if this isn't one of the keys in ctx, reproduce it literally
          return (group_1 in ctx) ? ctx[group_1] : full_match;
        });
        return new FileWatcher(filepath, 2500, wrapExec(command));
      });

      logger.debug('Created %d FileWatchers', file_watchers.length);
      callback(null, file_watchers);
    });
  });
};
