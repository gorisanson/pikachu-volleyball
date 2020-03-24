const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist'
  },
  entry: { main: './src/resources/js/main.js', ko: './src/resources/js/ko.js' },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    runtimeChunk: { name: 'runtime' } // this is for code-sharing between "main.js and "ko.js"
  },
  plugins: [
    new CopyPlugin([
      { from: 'src/resources/assets/', to: 'resources/assets/' },
      { from: 'src/resources/style.css', to: 'resources/style.css' },
      { from: 'src/index.html', to: 'index.html' }
    ]),
    new HtmlWebpackPlugin({
      template: 'src/en/index.html',
      filename: 'en/index.html',
      hash: true,
      chunks: ['runtime', 'main'],
      chunksSortMode: 'manual'
    }),
    new HtmlWebpackPlugin({
      template: 'src/ko/index.html',
      filename: 'ko/index.html',
      hash: true,
      chunks: ['runtime', 'ko', 'main'],
      chunksSortMode: 'manual'
    })
  ]
};
