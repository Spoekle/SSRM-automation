/**
 * Build config for electron renderer process
 */

import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import deleteSourceMaps from '../scripts/delete-source-maps';

checkNodeEnv('production');
deleteSourceMaps();

const configuration: webpack.Configuration = {
  devtool: false, // Disable source maps for smaller build size

  mode: 'production',

  target: ['web', 'electron-renderer'],

  entry: {
    renderer: path.join(webpackPaths.srcRendererPath, 'index.tsx'),
  },

  output: {
    path: webpackPaths.distRendererPath,
    publicPath: './',
    filename: '[name].bundle.js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    library: {
      type: 'umd',
    },
  },

  resolve: {
    fallback: {
      fs: false,
      querystring: require.resolve('querystring-es3'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      url: require.resolve('url/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
    },
  },

  externals: {
    electron: "commonjs2 electron",
  },

  module: {
    rules: [
      // Handle .node files (native binaries)
      {
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.s?(a|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: true,
              sourceMap: true,
              importLoaders: 1,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              api: 'modern',
              sassOptions: {
                // Any Sass options you want to configure
              },
            },
          },
        ],
        include: /\.module\.s?(c|a)ss$/,
      },
      {
        test: /\.s?(a|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern',
              sassOptions: {
                // Any Sass options you want to configure
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
            postcssOptions: {
              plugins:
                [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ]
              },
            },
          },
        ],
        exclude: /\.module\.s?(c|a)ss$/,
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // Images
      {
        test: /\.(png|jpg|jpeg|gif|webp|avif)$/i,
        type: 'asset/resource',
      },
      // SVG
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [{ removeViewBox: false }],
              },
              titleProp: true,
              ref: true,
            },
          },
          'file-loader',
        ],
      },
    ],
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.logs in production
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    usedExports: true, // Enable tree shaking
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react-libs',
          priority: 40,
        },
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: 'mui-libs',
          priority: 30,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor-libs',
          priority: 20,
        },
      },
    },
  },

  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
    }),

    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
      analyzerPort: 8889,
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(webpackPaths.srcRendererPath, 'index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      isBrowser: false,
      isDevelopment: false,
    }),

    new webpack.DefinePlugin({
      'process.type': '"renderer"',
    }),
  ],
};

export default merge(baseConfig, configuration);
