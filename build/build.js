require("./check-versions")();

process.env.NODE_ENV = "production";

var ora = require("ora");
var path = require("path");
var rm = require("rimraf");
var webpack = require("webpack");
var config = require("../config");
var webpackConfig = require("./webpack.prod.conf");

var spinner = ora("building for production...");
spinner.start();

rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), function(err) {
  if (err) {
    throw err;
  }

  webpack(webpackConfig, function(buildErr, stats) {
    spinner.stop();

    if (buildErr) {
      throw buildErr;
    }

    process.stdout.write(
      stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
      }) + "\n\n"
    );

    if (stats.hasErrors()) {
      process.exit(1);
    }

    console.log("Build complete.");
    console.log("Tip: built files are meant to be served over an HTTP server.");
  });
});
