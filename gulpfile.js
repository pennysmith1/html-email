var fs      = require('fs');
var del     = require('del');
var exists  = require('path-exists');

var middle  = require('@whitneyit/middle');

var gulp    = require('gulp');
var change  = require('gulp-change');
var ejs     = require('gulp-ejs');
var gzip    = require('gulp-gzip');
var inline  = require('gulp-inline-css');
var plumber = require('gulp-plumber');
var reload  = require('gulp-livereload');
var rename  = require('gulp-rename');
var s3      = require('gulp-s3');
var serve   = require('gulp-serve');

var aws     = require('./aws.json');

gulp.task('clean', function (done) {
    del(['dist'], function () {
        done();
    });
});

gulp.task('copy', ['clean'], function (done) {
    return gulp.src(['src/img/**'])
        .pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['copy'], function () {
    var data = require('./src/data/stamp.json');
    delete require.cache[require.resolve('./src/data/stamp.json')]
    return gulp.src(['src/html/**/*.tmpl.html'])
        .pipe(plumber())
        .pipe(ejs(data))
        .pipe(rename(function (path) {
            path.basename = path.basename.replace('.tmpl', '');
        }))
        .pipe(inline({
            applyStyleTags: true,
            removeLinkTags: true,
            preserveMediaQueries: true
        }))
        .pipe(change(function (content) {
            return content.replace(/src="img/g, 'src="https://s3-ap-southeast-2.amazonaws.com/co-mail/img');
        }))
        .pipe(reload())
        .pipe(gulp.dest('dist'));
});

gulp.task('release', ['build'], function () {
    return gulp.src(['dist/**/*'])
        .pipe(gzip())
        .pipe(s3(aws, {'gzippedOnly' : true}));
});

gulp.task('serve', serve({
    'middleware' : middle('dist'),
    'port'       : 3333,
    'root'       : 'dist'
}));

gulp.task('watch', function () {
    reload.listen({
        'port' : exists.sync('/home/vagrant') ? 3579 : 35729
    });
    gulp.watch(
        ['src/**/*'],
        ['build']
    );
});

gulp.task('default', ['build']);
