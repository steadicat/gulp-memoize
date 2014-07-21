# gulp-memoize

Wrap expensive transforms in `gulp-memoize`:

~~~
gulp.task('sprites', function() {
  return src(IMAGE_DIR + '*-sprite/*.png')
    .pipe(memoize($.sprites2x()));
});
~~~

In this example, `sprites2x` is performed only the first time the task
is ran, yet the output of the stream is the same on every run, so you
can safely pipe it into transforms that depend on this, like
`gulp-concat`.

If any of the files in the source change, the cache is busted and
everything is recomputed.
