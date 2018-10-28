var gulp = require('gulp')
var exec = require('child_process').exec

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

gulp.task('build', gulp.series('compile', function (done) {
  gulp.src('./test/spectrum/text/*')
    .pipe(gulp.dest('./dist/test/spectrum/text'))
  gulp.src('./test/spectrum/json/*')
    .pipe(gulp.dest('./dist/test/spectrum/json'))
  done()
}))


gulp.task('release', gulp.series('build', function (done) {
  gulp.src('./dist/src/**/*.js')
    .pipe(gulp.dest('./lib'))
  done()
}))
