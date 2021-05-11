const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    // 參考來源：https://stackoverflow.com/a/45278943
    "js/core": "./src/ts/core.ts",
    "js/options": "./src/ts/options.ts",
    "js/popup": "./src/ts/popup.ts",
    "background": "./src/ts/background.ts"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  plugins: [
    new CleanWebpackPlugin({ cleanStaleWebpackAssets: true }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./src/_locales",
          to: "./_locales"
        },
        {
          from: "./src/css",
          to: "./css"
        },
        {
          from: "./src/audio",
          to: "./audio",
          globOptions: {
            ignore: [
              //"**/*.txt"
            ]
          }
        },
        {
          from: "./src/html",
          to: "./html"
        },
        {
          from: "./src/images",
          to: "./images",
          globOptions: {
            ignore: [
              "**/*.psd"
            ]
          }
        }
      ]
    })
  ]
};