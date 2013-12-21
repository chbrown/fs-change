# fs-change

Node.js process to monitor changes to specified files or directories, and execute
some specified action in response.

`fs-change` accepts two command line arguments:

* `--config` where to read which files to watch.
    - By default, fs-change reads settings from `~/.fs-change`, i.e., from the user's home directory.
    - But the location of this file can be specified using this command line flag, e.g., `--config /opt/local/watching`.
* `--log` where to write the log file.
    - Defaults to `~/Library/Logs/fs-change.log` (which can easily be viewed with Console.app)

## Installation

For Mac OS X:

    # cd into this directory
    touch ~/.fs-change
    ./index.js install

This will add the `FSChange.app` application to the list of applications in your "login items,"
so that it gets started automatically.

After running `./index.js install`, either restart your computer or double click `FSChange.app`.

## `~/.fs-change` format

Each line has a glob (or simple file) on the left of a colon, and a command on
the right.

The command on the right will have the following keywords available:

- {file}, the fullpath of the matching file (usually just the string to the left
  of the colon).
- {basename}, the shortname of {file}, without path or extension.
- {dirname}, the directory containing {file}.

## `~/.fs-change` example

    /Users/chbrown/work/mailmaster/static/css/site.less: cd {dirname} && lessc -C site.less site.css
    /Volumes/sshfs_drive/app4/static/*.less: cd {dirname} && lessc -C {basename}.less {basename}.css

## TODO

* If some file does not exist, the script will continue to try the other files,
  and should retry any inaccessible file every 60 seconds. I do a lot of development on
  remote servers, so the files are only accessible when I have sshfs connected,
  but I don't want to have to run something to tell my LESS compiler that it
  should retry the filepath in question.
* Add documentation for macro syntax (`& /regex/flags/ => replacement`)

## License

Copyright © 2012–2013 Christopher Brown. [MIT Licensed](LICENSE).
