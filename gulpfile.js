const {
    dest,
    src,
} = require('gulp');

let gulp = require('gulp'),
    scss = require('gulp-sass'),
    server = require('browser-sync'),
    uglify = require('gulp-uglify-es').default,
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    fileinclude = require('gulp-file-include'),
    imagemin = require('gulp-imagemin'),
    del = require('del'),
    clean_css = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    babel = require('gulp-babel'),
    eslint = require('gulp-eslint'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webpcss'),
    plumber = require('gulp-plumber'),
    ttf2woof = require('gulp-ttf2woff'),
    ttf2woof2 = require('gulp-ttf2woff2'),
    svgSprite = require('gulp-svg-sprite'),
    gulpStylelint = require('gulp-stylelint');


let project_folder = require('path').basename(__dirname);

let path = {
    build: {
        html: project_folder + '/',
        js: project_folder + '/js/',
        style: project_folder + '/css/',
        img: project_folder + '/img/',
        fonts: project_folder + '/fonts/',
    },
    app: {
        html: ['app/*.html', '!' + 'app/_*.html'],
        js: 'app/js/script.js',
        style: 'app/scss/style.scss',
        img: 'app/images/**/*.{jpg,png,svg,gid,ico,webp}',
        fonts: 'app/fonts/**/*.ttf',
        sprites: 'app/sprites/**/*.svg',
    },
    watch: {
        html: 'app/**/*.html',
        js: 'app/js/**/*.js',
        style: 'app/scss/**/*.scss',
        img: 'app/images/**/*.{jpg,png,svg,gid,ico,webp}',
        fonts: 'app/fonts/**/*.*',
        sprites: 'app/sprites/**/*.svg',
    },
    clean: project_folder,
};


function html() {
    return src(path.app.html)
        .pipe(plumber())
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html));
}

function css() {
    return gulp.src(path.app.style)
        .pipe(plumber())
        .pipe(
            scss({
                outputStyle: 'compressed',
            }),
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 8 versions'],
            }),
        )
        .pipe(webpcss())
        .pipe(dest(path.build.style))
        .pipe(clean_css())
        .pipe(
            rename({
                suffix: '.min',
            }),
        )
        .pipe(dest(path.build.style));
}

function libsCss() {
    return src([
        'node_modules/normalize.css/normalize.css',
        'node_modules/slick-carousel/slick/slick.css',
        'node_modules/slick-carousel/slick/slick-theme.css',
    ])
        .pipe(plumber())
        .pipe(concat('libs.min.css'))
        .pipe(clean_css())
        .pipe(dest(path.build.style));
}

function linting() {
    return src(path.app.style)
        .pipe(plumber())
        .pipe(gulpStylelint({
            reporters: [{
                formatter: 'string',
                console: true,
            }],
        }));
}

function js() {
    return src(path.app.js)
        .pipe(plumber())
        .pipe(eslint({}))
        .pipe(eslint.format())
        .pipe(babel())
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js',
            }),
        )
        .pipe(dest(path.build.js));
}

function libsJs() {
    return src([
        'node_modules/slick-carousel/slick/slick.js',
    ])
        .pipe(plumber())
        .pipe(concat('libs.min.js'))
        .pipe(uglify())
        .pipe(dest(path.build.js));
}

function images() {
    return src(path.app.img)
        .pipe(plumber())
        .pipe(
            webp({
                quality: 70,
            }),
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.app.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{
                    removeViewBox: false,
                }],
                optimizationLevel: 3,
            }),
        )
        .pipe(dest(path.build.img));
}

function fonts() {
    return src(path.app.fonts)
        .pipe(plumber())
        .pipe(ttf2woof())
        .pipe(dest(path.build.fonts))
        .pipe(ttf2woof2())
        .pipe(dest(path.build.fonts));
}

function sprite() {
    return src(path.app.sprites)
        .pipe(plumber())
        .pipe(svgSprite({
                mode: {
                    stack: {
                        sprite: '../sprite.svg',  //sprite file name
                    },
                },
            },
        ))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{
                    removeViewBox: false,
                }],
                optimizationLevel: 3,
            }),
        )
        .pipe(dest(path.build.img));
}

function serve(cb) {
    server.init({
        server: project_folder,
        notify: false,
        open: true,
        cors: true,
    });

    gulp.watch([path.watch.html], gulp.series(html)).on('change', server.reload);
    gulp.watch([path.watch.style], gulp.series(css)).on('change', server.reload);
    gulp.watch([path.watch.js], gulp.series(js)).on('change', server.reload);
    gulp.watch([path.watch.img], gulp.series(images)).on('change', server.reload);
    gulp.watch([path.watch.sprites], gulp.series(images)).on('change', server.reload);

    return cb();
}

function clean() {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(html, css, libsCss, js, libsJs, images, fonts, linting, sprite));
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
exports.sprite = sprite;
exports.default = watch;
