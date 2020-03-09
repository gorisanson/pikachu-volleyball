const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: { main: "./src/main.js" },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([
      { from: "src/assets", to: "assets" },
      { from: "src/index.html" }
    ]),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      hash: true
    })
  ]
};
