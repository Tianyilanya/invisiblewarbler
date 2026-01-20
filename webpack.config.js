const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 添加静态文件复制插件
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      // 只处理小图片，排除 GLB/GLTF
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
        parser: {
          dataUrlCondition: {
            maxSize: 1024 * 1024, // 1MB
          },
        },
      },
      // GLB/GLTF 文件完全排除，让它们作为静态文件
      {
        test: /\.(glb|gltf)$/i,
        type: false, // 完全排除
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    // 复制静态资源到 dist 目录
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, 'public/models'),
          to: 'models',
          noErrorOnMissing: true,
        },
        {
          from: path.join(__dirname, 'public/music'),
          to: 'music',
          noErrorOnMissing: true,
        },
        {
          from: path.join(__dirname, 'public/hdr'),
          to: 'hdr',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
      {
        directory: path.join(__dirname, 'src'),
        publicPath: '/src/',
      },
      {
        directory: path.join(__dirname, 'node_modules'),
        publicPath: '/node_modules/',
      },
      {
        directory: path.join(__dirname, 'three.js-dev'),
        publicPath: '/three.js-dev/',
      },
    ],
    hot: true,
    open: true,
  },
  resolve: {
    extensions: ['.js'],
  },
};
