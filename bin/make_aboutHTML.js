#! /usr/bin/env node

var marked = require('../lib/bower_components/marked/lib/marked')
  , fs = require('fs')
  , tpl, md
  ;


tpl =  fs.readFileSync('./about.tpl', 'utf-8');
md = fs.readFileSync('./about.md', 'utf-8');
html = marked.parse(md);


console.log(tpl.replace('{content}', html));
