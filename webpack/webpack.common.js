const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
    entry: {
      options: path.join(srcDir, 'options.tsx'),
      background: path.join(srcDir, 'background.ts'),
      offscreen: path.join(srcDir, 'offscreen.ts'),
      "plugin-discovery": path.join(srcDir, 'plugin-discovery.ts'),
      "isolation-bridge": path.join(srcDir, 'isolation-bridge.ts'),
      "xhrpatch": path.join(srcDir, 'xhrpatch.js'),
    },
    output: {
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
        webassemblyModuleFilename: "static/wasm/[hash].wasm",
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks(chunk) {
              return chunk.name !== 'background';
            }
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /.*\.wasm$/,
                type: "asset/resource",
                generator: {
                  filename: "static/wasm/[name].[contenthash][ext]",
                },
              },
        ],
        
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".wasm"],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
    ],
    experiments: {
        asyncWebAssembly: true,
      },
};
