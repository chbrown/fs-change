# less-watch

Node process to monitor changes to specified files or directories, and execute
some specified action in response.

Settings are stored in `~/.less-watch`

If some file does not exist, the script will continue to try the other files,
and retry any inaccessible file every 60 seconds. I do a lot of development on
remote servers, so the files are only accessible when I have sshfs connected,
but I don't want to have to run something to tell my LESS compiler that it
should retry the filepath in question.

(This particular feature is not actually in 0.0.1, by the way. It's planned.)

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

MIT Licensed, 2012