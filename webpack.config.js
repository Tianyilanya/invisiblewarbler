const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// Vercel 会自动处理 public 目录中的静态文件，无需复制

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
        use: 'null-loader', // 使用null-loader完全排除
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    // Vercel 会自动处理 public 目录中的静态文件，无需手动复制
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
