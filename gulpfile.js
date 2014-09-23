var gulp = require('gulp'),
    gutil = require('gulp-util'),
    browserify = require('gulp-browserify'),
    reactify = require('reactify'),
    rename = require('gulp-rename'),
    connect = require('gulp-connect'),
    jest = require('gulp-jest');

gulp.task('style', function() {
  gulp.src('css/app.css')
    .pipe(gulp.dest('build/css'));
});

gulp.task('html', function() {
  gulp.src('index.html')
      .pipe(gulp.dest('build'));
});

gulp.task('jest', function() {
  return gulp.src('spec').pipe(jest({
    scriptPreprocessor: "preprocessor.js",
    unmockedModulePathPatterns: [
      "node_modules/react"
    ],
    testDirectoryName: "spec",
    testPathIgnorePatterns: [
      "node_modules",
      "preprocessor.js"
    ],
    moduleFileExtensions: [
      "js",
      "react"
    ]
  }));
});

gulp.task('build', ['html', 'style'], function() {
  // Single entry to browserify
  gulp.src('js/app.react')
      .pipe(browserify({
        insertGlobals: true,
        debug: !gulp.env.production,
        extensions: ['.react'],
        transform: [reactify]
      }))
      .pipe(rename('app.js'))
      .pipe(gulp.dest('./build'))
});

gulp.task('frontendServer', ['build'], function() {
  connect.server({
    root: 'build',
    livereload: true
  });
});

gulp.task('default', ['jest', 'build', 'frontendServer']);
