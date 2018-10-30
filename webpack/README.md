# webpack

## tips

loader：
- `style-loader`, `css-loader`导入style
- `file-loader` 加载图片，字体等
- `image-webpack-loader` 和 `url-loader` 压缩图片相关
- `csv-loader` `xml-loader`csv文件和xml文件
- 通过使用 `imports-loader` 覆写 this
- `babel-polyfill`
- `whatwg-fetch`

plugin：
- `html-webpack-plugin`打包时增加html文件
- `clean-webpack-plugin`清除打包目录文件
- `WebpackManifestPlugin`对「你的模块映射到输出 bundle 的过程」保持追踪
- `webpack.NamedModulesPlugin` `webpack.HotModuleReplacementPlugin`
- 压缩相关`BabelMinifyWebpackPlugin` `ClosureCompilerPlugin`
- `ExtractTextPlugin` 将 CSS 分离成单独的文件
- 使用 `CommonsChunkPlugin` 去重和分离 chunk。
- `HashedModuleIdsPlugin`固定不变的打包文件
- `ProvidePlugin`
    - 能够在通过 webpack 编译的每个模块中，通过访问一个变量来获取到 package 包。
    - 暴露某个模块中单个导出值
    ```javascript
    // src/index.js
  function component() {
    var element = document.createElement('div');
    element.innerHTML = join(['Hello', 'webpack'], ' ');

    return element;
  }

  document.body.appendChild(component());

  // webpack.config.js
  const path = require('path');
  const webpack = require('webpack');
  module.exports = {
    entry: './src/index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist')
    },
    plugins: [
      new webpack.ProvidePlugin({
        join: ['lodash', 'join']
      })
    ]
  };
    // 这样就能很好的与 tree shaking 配合，将 lodash 库中的其他没用到的部分去除。
    ```
- `workbox-webpack-plugin`离线应用

> 避免在生产中使用 inline-*** 和 eval-***，因为它们可以增加 bundle 大小，并降低整体性能。

## tree shaking
- 使用 ES2015 模块语法（即 import 和 export）。
- 在项目 package.json 文件中，添加一个 "sideEffects" 入口。
- 引入一个能够删除未引用代码(dead code)的压缩工具(minifier)（例如 UglifyJSPlugin）

## bundle 分析(bundle analysis)
如果我们以分离代码作为开始，那么就以检查模块作为结束，分析输出结果是很有用处的。官方分析工具 是一个好的初始选择。下面是一些社区支持(community-supported)的可选工具：

- `webpack-chart`: webpack 数据交互饼图。
- `webpack-visualizer`: 可视化并分析你的 bundle，检查哪些模块占用空间，哪些可能是重复使用的。
- `webpack-bundle-analyzer`: 一款分析 bundle 内容的插件及 CLI 工具，以便捷的、交互式、可缩放的树状图形式展现给用户。