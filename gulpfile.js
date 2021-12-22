const { dest, src, parallel } = require('gulp');
const minify = require("gulp-minify");
const cleanCss = require("gulp-clean-css");
var rename = require('gulp-rename');

function minifyJS() {
  return src([
    'scripts/*.js',
    '!scripts/*.min.js'
  ])
  .pipe(minify({
    ext: {
      src: '.js',
      min: '.min.js'
    }
  }))
  .pipe(dest('scripts'));
}

function minifyCSS () {
  return src([
    'scripts/*.css',
    '!scripts/*.min.css'
  ])
  .pipe(cleanCss())
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(dest('scripts'));
}

exports.default = parallel(minifyJS, minifyCSS);
