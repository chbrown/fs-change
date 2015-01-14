# fs-change

Monitor files or directories and execute actions in response to changes.

File watchers and triggered actions are specified in a single file.


## Watch file format

The location of this file defaults to `~/.fs-change`.

Each line has a glob (or simple file) on the left of a colon, and a command on
the right.

The command on the right will have the following keywords available:

- `{file}`, the fullpath of the matching file (usually just the string to the
  left of the colon).
- `{basename}`, the shortname of {file}, without path or extension.
- `{dirname}`, the directory containing {file}.

Example:

    /Users/chbrown/work/mailmaster/static/css/site.less: cd {dirname} && lessc -C site.less site.css
    /Volumes/sshfs_drive/app4/static/*.less: cd {dirname} && lessc -C {basename}.less {basename}.css


## Configuration

The following environment variables can be used to configure the behavior of
the file listener.

* `OSX` [default: unset]

  If set, fs-change will log to the NotificationCenter as well as STDOUT/STDERR.

* `CONFIG` [default: '~/.fs-change']

  Specify the path to the configuration file specifying the files to watch.

* `DEBUG` [default: unset]

  If set, fs-change will set the log level to DEBUG.


## Installation

    fs-change print-launch-agent > ~/Library/LaunchAgents/npmjs.fs-change.plist
    launchctl load ~/Library/LaunchAgents/npmjs.fs-change.plist

The generated LaunchAgent will log to `~/Library/Logs/fs-change.log`, which
you can view in `Console.app`.

To uninstall:

    launchctl unload ~/Library/LaunchAgents/npmjs.fs-change.plist
    rm ~/Library/LaunchAgents/npmjs.fs-change.plist


## TODO

* If some file does not exist, the script will continue to try the other files,
  and should retry any inaccessible file every 60 seconds. I do a lot of development on
  remote servers, so the files are only accessible when I have sshfs connected,
  but I don't want to have to run something to tell my LESS compiler that it
  should retry the filepath in question.
* Add documentation for macro syntax (`& /regex/flags/ => replacement`)


## License

Copyright 2012-2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
