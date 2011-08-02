#!/bin/sh
# The location of your yuidoc install
yuidoc_home=${yuidoc_home:-../yui/yui-doc}

# The location of the files to parse.  Parses subdirectories, but will fail if
# there are duplicate file names in these directories.  You can specify multiple
# source trees:
#     parser_in="%HOME/www/yui/src %HOME/www/event/src"
parser_in="lib test"

# The location to output the parser data.  This output is a file containing a 
# json string, and copies of the parsed files.
parser_tmp=${parser_tmp:-./tmp}

# The directory to put the html file outputted by the generator
generator_out=./doc

# The location of the template files.  Any subdirectories here will be copied
# verbatim to the destination directory.
template=./doc/template

# The version of your project to display within the documentation.
version=`grep version package.json | sed 's/.*: "\(.*\)".*/\1/'`

# The version of YUI the project is using.  This effects the output for
# YUI configuration attributes.  This should start with '2' or '3'.
yuiversion=3

# The project and URL
project="Node.js Configuration"
project_url="https://github.com/lorenwest/node-config"

##############################################################################
# add -s to the end of the line to show items marked private

rm doc/*.html
$yuidoc_home/bin/yuidoc.py \
  $parser_in \
  -p $parser_tmp \
  -o $generator_out \
  -t $template \
  -m "$project" \
  -u "$project_url" \
  -v $version \
  -Y $yuiversion

rm -rf $parser_tmp

echo Copying the documentation to ../lorenwest.github.com/node-config/$version
rm -rf ../lorenwest.github.com/node-config/$version
cp -R doc ../lorenwest.github.com/node-config/$version
echo Copying the documentation to ../lorenwest.github.com/node-config/latest
rm -rf ../lorenwest.github.com/node-config/latest
cp -R doc ../lorenwest.github.com/node-config/latest
