'use strict'; /*jslint es5: true, node: true, indent: 2 */
var _ = require('underscore');
var fs = require('fs');
var logger = require('winston');

var FileWatcher = exports.FileWatcher = function(filepath, onchange, opts) {
  /** FileCallback: watch a filepath for changes, executing `onchange` when the file changes.

  Mostly a wrapper around fs.watch / fs.FSWatcher, but with some debounce.

  filepath: String
  onchange: function()
  opts:
    delay: Integer (default: 0)
      Milliseconds to wait before calling onchange again
      A delay of 0ms means onchange will be called immediately every time (no debounce)
    autostart: Boolean (default: false)
      Start immediately if true

  ## file_callback.start()

  Start the underlying watcher.

  ## file_callback.stop()

  Close the underlying watcher.
  */
  this.filepath = filepath;
  this.onchange = onchange;
  this.opts = _.extend({delay: 0, autostart: false}, opts);

  if (this.opts.autostart) {
    this.start();
  }
};
FileWatcher.prototype.start = function() {
  // debounce for a period of 2s, but execute on the immediate end
  var self = this;
  var last_called = -1;

  this.fs_watcher = fs.watch(this.filepath)
  .on('change', function(event, filename) {
    // filename may not actually be supplied
    // TODO: check last modified stats?
    // if (curr.mtime.valueOf() != prev.mtime.valueOf() ||
    //   curr.ctime.valueOf() != prev.ctime.valueOf()) {
    var since_last = Date.now() - last_called;
    logger.debug('Saw %s on %s (%dms since last call)', event, self.filepath, since_last);
    if (since_last >= self.opts.delay) {
      self.onchange();
      last_called = Date.now();
    }
    else {
      logger.debug('Not firing onchange due to debounce (%d < %d)', since_last, self.opts.delay);
    }
  })
  .on('error', function(err) {
    logger.error('Error in fs.watch: %s', err);
  });
};
FileWatcher.prototype.stop = function() {
  this.fs_watcher.close();
};
