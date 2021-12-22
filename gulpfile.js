const { dest, src, parallel } = require('gulp');
const minify = require("gulp-minify");
const cleanCss = require("gulp-clean-css");
var rename = require('gulp-rename');

function minifyJS() {
  return src([
    'public/*.js',
    '!public/*.min.js'
  ])
  .pipe(minify({
    ext: {
      src: '.js',
      min: '.min.js'
    }
  }))
  .pipe(dest('public'));
}

function minifyCSS () {
  return src([
    'public/*.css',
    '!public/*.min.css'
  ])
  .pipe(cleanCss())
  .pipe(rename({
    suffix: '.min'
  }))
  .pipe(dest('public'));
}

exports.default = parallel(minifyJS, minifyCSS);