# less-watch

Node process to monitor changes to specified files or directories, and execute
some specified action in response.

Settings are stored in `~/.less-watch`

If some file does not exist, the script will continue to try the other files,
and retry any inaccessible file every 60 seconds. I do a lot of development on
remote servers, so the files are only accessible when I have sshfs connected,
but I don't want to have to run something to tell my LESS compiler that it
should retry the filepath in question.

(This particular feature is not actually in 0.0.3, by the way. It's planned.)

## Installation

### Under Mac OS X:

    # cd into this directory
    touch ~/.less-watch
    ./install

This will add the `LessWatch.app` application to the list of applications in your "login items,"
so that it gets started automatically.

After running `./install`, either restart your computer or double click `LessWatch.app`.

### Under Linux:

	# cd into this directory
	touch ~/.less-watch
	./install # note the lack of sudo here!

This will append a new line on your ~/.profile.

Tested with Ubuntu 13.04, but it should work on other Linux systems that reads ~/.profile during the login process.

## `~/.less-watch` format

Each line has a glob (or simple file) on the left of a colon, and a command on
the right.

The command on the right will have the following keywords available:

- {file}, the fullpath of the matching file (usually just the string to the left
  of the colon).
- {basename}, the shortname of {file}, without path or extension.
- {dirname}, the directory containing {file}.

## `~/.less-watch` example

    /Users/chbrown/work/mailmaster/static/css/site.less: cd {dirname} && lessc -C site.less site.css
    /Volumes/sshfs_drive/app4/static/*.less: cd {dirname} && lessc -C {basename}.less {basename}.css

## License

MIT Licensed, 2012-2013
