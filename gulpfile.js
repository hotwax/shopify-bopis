const { dest, src } = require('gulp');
const minify = require("gulp-minify");

function defaultTask() {
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
exports.default = defaultTask;