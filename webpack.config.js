const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  //mode: "production",
  entry: {
    main: "./src/main.js",
    pikavolley: "./src/pikavolley.js",
    pika_view: "./src/pika_view.js",
    pika_physics: "./src/pika_physics.js",
    pika_cloud_and_wave: "./src/pika_cloud_and_wave.js",
    pika_audio: "./src/pika_audio.js",
    pika_keyboard: "./src/pika_keyboard.js",
    rand: "./src/rand.js"
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([
      { from: "src/assets", to: "assets" },
      { from: "src/index.html" }
    ])
  ]
};
