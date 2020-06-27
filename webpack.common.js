const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  entry: { main: './src/resources/js/main.js', ko: './src/ko/ko.js' },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    runtimeChunk: { name: 'runtime' }, // this is for code-sharing between "main.js" and "ko.js"
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        {
          context: 'src/',
          from: 'resources/assets/**/*.+(json|png|mp3|wav)',
        },
        { from: 'src/en/manifest.json', to: 'en/manifest.json' },
        { from: 'src/ko/manifest.json', to: 'ko/manifest.json' },
        { from: 'src/zh/manifest.json', to: 'zh/manifest.json' },
        { from: 'src/resources/style.css', to: 'resources/style.css' },
        { from: 'src/index.html', to: 'index.html' },
        {
          from: 'src/en/update-history/index.html',
          to: 'en/update-history/index.html',
        },
        {
          from: 'src/ko/update-history/index.html',
          to: 'ko/update-history/index.html',
        },
        {
          from: 'src/zh/update-history/index.html',
          to: 'zh/update-history/index.html',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: 'src/en/index.html',
      filename: 'en/index.html',
      chunks: ['runtime', 'main'],
      chunksSortMode: 'manual',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: 'src/ko/index.html',
      filename: 'ko/index.html',
      chunks: ['runtime', 'ko', 'main'],
      chunksSortMode: 'manual',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: 'src/zh/index.html',
      filename: 'zh/index.html',
      chunks: ['runtime', 'main'],
      chunksSortMode: 'manual',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
      },
    }),
    new WorkboxPlugin.GenerateSW({
      swDest: 'sw.js',
      cleanupOutdatedCaches: true,
      skipWaiting: false,
    }),
  ],
};
