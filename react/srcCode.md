# react 源码 (v15.0)

## src

- `addons`: 包含了一系列的工具方法插件
- `isomorphic`: 包含一系列同构方法
- `shared`: 包含一些公用或常用方法
- `test`: 包含一些测试方法
- `core/tests`: 包含一些边界错误的测试用例
- `renderers`: 是React代码的核心部分, 大部分的功能实现, 此处对其进行单独分析
  - `dom`: 包含client, server, shared
    - client: 包含DOM操作
    - server: 包含服务端渲染的实现和方法
    - shared: 包含文本组件, 标签组件, dom属性操作, css属性操作等
  - `shared`: 包含event和reconciler
    - event: 包含一些更为底层的事件方法.
    - reconciler: 协调器, 最为核心部分

