## todo

### webpack

magic comments 异步打包名称

```javascript
webpackconfig = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        // ...
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  }
}
```

### mpa weboack 多页应用

- next
- nuxt
- nest

### 优化

开发阶段
- 开启多核压缩
- 监控你的面板  speed-measure-webpack-plugin
- 开启通知面板
- 开启打包进度  progress-bar-webpack-plugin
- 开发面板更清晰
- 开启窗口标题
- 窗口打印更直接

上线阶段
- es6 不需要编译 