/** @format */

const { task, src, dest, watch: gulpWatch, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const ts = require("gulp-typescript");
const eslint = require("gulp-eslint");

const project = ts.createProject({
  target: "ESNext",
  module: "commonjs",
  moduleResolution: "node",
  outDir: "dist/",
  declaration: true,
  declarationDir: "Typings/",
  esModuleInterop: true,
  resolveJsonModule: true
});

function scss() {
  return src("src/dashboard/sass/*.scss")
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(sass().on("error", sass.logError))
    .pipe(dest("dist/dashboard/css"));
}

function typescript() {
  return src(["src/*.ts", "src/**/*.ts"], { ignore: "dashboard" })
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(project())
    .pipe(dest("dist/"));
}

const compile = series(scss, typescript);

task("watch", () => gulpWatch(["src/"], compile));

task("build", series(compile));
