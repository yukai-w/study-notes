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
- `exports-loader` 将一个全局变量当做一个普通的模块导出

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

## typescript

- npm install --save-dev typescript ts-loader
- 添加tsconfig.json
- 配置loader


## LOADERS
loader 用于对模块的源代码进行转换。loader 可以使你在 import 或"加载"模块时预处理文件。因此，loader 类似于其他构建工具中“任务(task)”，并提供了处理前端构建步骤的强大方法。loader 可以将文件从不同的语言（如 TypeScript）转换为 JavaScript，或将内联图像转换为 data URL。loader 甚至允许你直接在 JavaScript 模块中 import CSS文件！

### 使用loader
在你的应用程序中，有三种使用 loader 的方式：

- 配置（推荐）：在 webpack.config.js 文件中指定 loader。
- 内联：在每个 import 语句中显式指定 loader。
- CLI：在 shell 命令中指定它们。

### loader的特性
- loader 支持链式传递。能够对资源使用流水线(pipeline)。一组链式的 loader 将按照相反的顺序执行。loader 链中的第一个 loader 返回值给下一个 loader。在最后一个 loader，返回 webpack 所预期的 JavaScript。
- loader 可以是同步的，也可以是异步的。
- loader 运行在 Node.js 中，并且能够执行任何可能的操作。
- loader 接收查询参数。用于对 loader 传递配置。
- loader 也能够使用 options 对象进行配置。
- 除了使用 package.json 常见的 main 属性，还可以将普通的 npm 模块导出为 loader，做法是在package.json 里定义一个 loader 字段。
- 插件(plugin)可以为 loader 带来更多特性。
- loader 能够产生额外的任意文件。

### 如何编写一个loader
- loader 会返回一个或者两个值。第一个值的类型是 JavaScript 代码的字符串或者 buffer。第二个参数值是 SourceMap，它是个 JavaScript 对象。

需要注意:
- 简单易用。
- 使用链式传递。
- 模块化的输出。
- 确保无状态。
- 使用 loader utilities。
- 记录 loader 的依赖。
- 解析模块依赖关系。
- 提取通用代码。
- 避免绝对路径。
- 使用 peer dependencies。

## PLUGIN
插件是 webpack 的支柱功能。webpack 自身也是构建于，你在 webpack 配置中用到的相同的插件系统之上！
插件目的在于解决 loader 无法实现的其他事。

### 如何编写一个插件
webpack插件组成:
- 一个 JavaScript 命名函数。
- 在插件函数的 prototype 上定义一个 apply 方法。
- 指定一个绑定到 webpack 自身的事件钩子。
- 处理 webpack 内部实例的特定数据。
- 功能完成后调用 webpack 提供的回调。