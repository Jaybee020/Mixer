const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.ts", // bundle"s entry point
  output: {
    path: path.resolve(__dirname, "dist"), // output directory
    filename: "[name].js", // name of the generated bundle
  },
  resolve: {
    extensions: [".js", ".ts", ".json"],
    fallback: {
      crypto: false,
      util: false,
      os: false,
      vm: false,
      path: require.resolve("path-browserify"),
      fs: false,
      module: false,
      assert: false,
      perf_hooks: false,
      stream: false,
      zlib: false,
      http: require.resolve("stream-http"),
      net: false,
      tls: false,
      async_hooks: false,
      console: false,
      repl: false,
      child_process: false,
      constants: false,
      https: require.resolve("https-browserify"),
      domain: false,
    },
  },

  mode: "development",

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },

      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /.node$/,
        loader: "node-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      inject: "body",
    }),
    new webpack.DefinePlugin({
      process: "process/",
    }),
  ],

  watch: true,

  devServer: {
    historyApiFallback: true,
    contentBase: "./",
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000,
    },
  },
};
