/*jslint node: true */
var util = require('util-enhanced');
var fs = require('fs');
var logger = require('winston');

/** new FileWatcher(filepath: string, delay: number, onchange: ())

Watch a filepath for changes, calling `onchange` when the file changes.

Mostly a wrapper around fs.watch / fs.FSWatcher, but with some debounce.

delay
  Milliseconds to wait before calling onchange again. A delay of 0 means
  onchange will be called immediately every time the file changes (no debounce).
*/
function FileWatcher(filepath, delay, onchange) {
  this.filepath = filepath;
  this.onchange = onchange;
  this.delay = delay;
}

/** FileWatcher#start()

Start the underlying watcher.

Debounces for a period of `delay` seconds; executes on the immediate end.
*/
FileWatcher.prototype.start = function() {
  var self = this;
  var last_called = -1;

  this.fs_watcher = fs.watch(this.filepath, {persistent: true})
  .on('change', function(event, filename) {
    // filename may not actually be supplied
    // TODO: check last modified stats?
    // if (curr.mtime.valueOf() != prev.mtime.valueOf() ||
    //   curr.ctime.valueOf() != prev.ctime.valueOf()) {
    var since_last = Date.now() - last_called;
    logger.debug('Saw %s on %s (%dms since last call)', event, self.filepath, since_last);
    if (since_last >= self.delay) {
      self.onchange();
      last_called = Date.now();
    }
    else {
      logger.debug('Not firing onchange due to debounce (%d < %d)', since_last, self.delay);
    }
  })
  .on('error', function(err) {
    logger.error('Error in fs.watch: %s', err);
  });
};

/** FileWatcher#stop()

Close the underlying watcher.
*/
FileWatcher.prototype.stop = function() {
  this.fs_watcher.close();
};

module.exports = FileWatcher;
