var gulp = require('gulp')
var exec = require('child_process').exec
var bump = require('gulp-bump')
var readline = require('readline')
// var fs = require('fs')
// var semvar = require('semvar')

gulp.task('build', ['compile'], function () {
  gulp.src('./test/spectrum/text/*')
    .pipe(gulp.dest('./dist/test/spectrum/text'))
  gulp.src('./test/spectrum/json/*')
    .pipe(gulp.dest('./dist/test/spectrum/json'))
})

gulp.task('compile', function (done) {
  exec('tsc --module commonjs', function (err, stdOut, stdErr) {
    console.log(stdOut)
    if (err) {
      done(err)
    } else {
      done()
    }
  })
})

gulp.task('release', ['build'], function () {
  gulp.src('./dist/src/**/*.js')
    .pipe(gulp.dest('./lib'))
})
