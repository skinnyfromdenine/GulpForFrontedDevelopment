const {
    dest,
    src
} = require('gulp');

let gulp = require('gulp'),
    scss = require('gulp-sass'),
    server = require('browser-sync'),
    uglify = require('gulp-uglify-es').default,
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    fileinclude = require("gulp-file-include"),
    imagemin = require("gulp-imagemin"),
    del = require('del'),
    clean_css = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    babel = require('gulp-babel'),
    eslint = require('gulp-eslint'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webpcss'),
    svgSprite = require('gulp-svg-sprite'),
    gulpStylelint = require('gulp-stylelint');


let project_folder = require('path').basename(__dirname);

let path = {
    build: {
        html: project_folder + '/',
        js: project_folder + '/js/',
        style: project_folder + '/css/',
        img: project_folder + '/img/',
        fonts: project_folder + '/fonts/'
    },
    app: {
        html: ['app/*.html', '!' + 'app/_*.html'],
        js: 'app/js/main.js',
        style: 'app/scss/style.scss',
        img: 'app/images/**/*.{jpg,png,svg,gid,ico,webp}',
        fonts: 'app/fonts/**/*.ttf'
    },
    watch: {
        html: 'app/**/*.html',
        js: 'app/js/**/*.js',
        style: 'app/scss/**/*.scss',
        img: 'app/images/**/*.{jpg,png,svg,gid,ico,webp}',
        fonts: 'app/fonts/**/*.*'
    },
    clean: project_folder
};


function html() {
    return src(path.app.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
}

function css() {
    return gulp.src(path.app.style)
        .pipe(
            scss({
                outputStyle: 'compressed'
            })
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 8 versions']
            })
        )
        .pipe(
            rename({
                suffix: '.min'
            })
        )
        .pipe(webpcss())
        .pipe(clean_css())
        .pipe(dest(path.build.style))
}

function libsCss() {
    return src([
            'node_modules/normalize.css/normalize.css',
            'node_modules/slick-carousel/slick/slick.css',
            'node_modules/slick-carousel/slick/slick-theme.css',
        ])
        .pipe(concat('libs.min.css'))
        .pipe(clean_css())
        .pipe(dest(path.build.style))
}

function linting() {
    return src(path.app.style)
        .pipe(gulpStylelint({
            reporters: [{
                formatter: 'string',
                console: true
            }]
        }));
}

function js() {
    return src(path.app.js)
        .pipe(eslint({}))
        .pipe(eslint.format())
        .pipe(babel())
        .pipe(uglify())
        .pipe(dest(path.build.js))
}

function libsJs() {
    return src([
            'node_modules/slick-carousel/slick/slick.js'
        ])
        .pipe(concat('libs.min.js'))
        .pipe(fileinclude())
        .pipe(uglify())
        .pipe(dest(path.build.js))
}

function images() {
    return src(path.app.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.app.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{
                    removeViewBox: false
                }],
                optimizationLevel: 3
            })
        )
        .pipe(dest(path.build.img))
}

function sprite() {
    return src(path.app.img)
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg  '
                }
            },
        }))
        .pipe(dest(path.build.img))
}

function fonts() {
    return src(path.app.fonts)
        .pipe(dest(path.build.fonts))
}

function serve(cb) {
    server.init({
        server: project_folder,
        notify: false,
        open: true,
        cors: true
    })

    gulp.watch([path.watch.html], gulp.series(html)).on('change', server.reload)
    gulp.watch([path.watch.style], gulp.series(css)).on('change', server.reload)
    gulp.watch([path.watch.js], gulp.series(js)).on('change', server.reload)
    gulp.watch([path.watch.img], gulp.series(images)).on('change', server.reload)

    return cb()
}

function clean(params) {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(html, css, libsCss, js, libsJs, images, fonts, linting, sprite))
let watch = gulp.parallel(serve, build);

exports.images = images;
exports.js = js;
exports.build = build;
exports.css = css;
exports.html = html;
exports.watch = watch;
exports.libsCss = libsCss;
exports.libsJs = libsJs;
exports.linting = linting;
exports.default = watch;