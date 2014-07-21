var path = require('path');
var crypto = require('crypto');
var gutil = require('gulp-util');
var through2 = require('through2');

var cache = {};

function getHash(buffer) {
  buffer.sort(function(a, b) {
    return a.path.localeCompare(b.path);
  });
  var hash = crypto.createHash('md5');
  buffer.forEach(function(file) {
    hash.update(file.contents);
  });
  return hash.digest('hex');
}

module.exports = function(stream) {
	if (!stream) {
		throw new gutil.PluginError('gulp-memoized', {
      message: 'Child action is required'
    });
	}

  var buffer = [];

  return through2.obj(function(file, enc, cb) {
    if (file.isStream()) {
      return cb(new gutil.PluginError('gulp-memoized', {
        message: 'Streams are not supported',
        fileName: file.path
      }));
    }
    buffer.push(file);
    cb();
  }, function(cb) {
    var hash = getHash(buffer);
    if (cache[hash]) {
      gutil.log(gutil.colors.yellow('Found cached hash'), gutil.colors.cyan(hash));
      // Replay the last results
      cache[hash].forEach(function(file) {
        this.push(file);
      }.bind(this));
      buffer = [];
      cb();
    } else {
      gutil.log(gutil.colors.yellow('Recomputing'), gutil.colors.cyan(hash));
      // Recompute and save the results
      cache[hash] = [];
      stream.on('data', function(file) {
        gutil.log(gutil.colors.yellow('Recomputed file'), gutil.colors.cyan(file.path));
        cache[hash].push(file);
        this.push(file);
      }.bind(this));
      stream.on('end', function() {
        gutil.log(gutil.colors.yellow('Recompute done'), gutil.colors.cyan(hash));
        this.end();
        buffer = [];
        cb();
      }.bind(this));

      buffer.forEach(function(file) {
        stream.write(file);
      });
      stream.end();
    }
  });
};
