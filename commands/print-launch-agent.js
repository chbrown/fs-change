#!/usr/bin/env node
var fs = require('fs');
var path = require('path');

var filepath = path.join(__dirname, '..', 'launch-agent.plist');
var template = fs.readFileSync(filepath, {encoding: 'utf8'});

var string = template.replace(/\$\{(\w+)\}/g, function(match, group, index) {
  return process.env[group];
});

process.stdout.write(string);
