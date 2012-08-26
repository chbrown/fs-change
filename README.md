# less-watch

Node process to monitor changes to specified files or directories, and execute
some specified action in response.

Settings are stored in `~/.less-watch`

If some file does not exist, the script will continue to try the other files,
and retry any inaccessible file every 60 seconds. This is 

## `~/.less-watch` format

Each line has a file on the left of a colon, and a command on the right.

The command on the right will have the following keywords available:

- {file}, the fullpath of the matching file (usually just the file to the left
  of the colon) 
- {dir}, the directory containing {file}

## `~/.less-watch` example

/Users/chbrown/work/mailmaster/static/css/site.less: cd {dir} && lessc -C site.less site.css
/Volumes/sshfs_drive/app4/static/master.less: cd {dir} && lessc -C master.less master.css

## License

MIT Licensed, 2012