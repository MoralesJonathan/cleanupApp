var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('sass', function() {
  return gulp.src('sass/*.sass')
    .pipe(plumber(function(error) {
      console.log(error.toString());
      this.emit('end');
    }))
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('public/css/'));
});

gulp.task('autoprefix', ['sass'], function() {
  return gulp.src('public/css/*.css')
    .pipe(autoprefixer())
    .pipe(gulp.dest('public/css/'));
});

gulp.task('watch', function() {
  gulp.watch('Platform/dev/sass/*.sass', ['sass','autoprefix']);
});

gulp.task('default', [ 'sass', 'autoprefix', 'watch'], function() {});
