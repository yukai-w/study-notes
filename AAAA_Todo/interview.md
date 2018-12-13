- flex 兼容  postcss
- Grid
- 上下左右居中
- 原型链
- 事件
- http2.0 websoket https 状态码
- webpack配置 loader如何书写 plugin如何书写
- 插件 transform-runtime
- profill
- webpack.optimize.UglifyJsPlugin这个插件，有没有觉得压缩速度很慢，有什么办法提升速度
- 跨域 cors
- 深拷贝
- babel 如何转译
- git flow
- 函数科里化
- commonJs UMD CMD， es6模块化跟他们的区别
- react vue 区别 新特性
- getBoundingClientRect获取的top和offsetTop获取的top区别
- xss,CSRF,点击劫持，Cookie安全，HTTP窃听篡改，密码安全，SQL注入
- 数组去重

# React

## React每个生命周期做了什么
### v16之前

组件初始化(initialization)阶段:

super(props)用来调用基类的构造方法( constructor() ), 也将父组件的props注入给子组件，功子组件读取(组件中props只读不可变，state可变)。
而constructor()用来做一些组件的初始化工作，如定义this.state的初始内容。

组件的挂载(Mounting)阶段:

- componentWillMount: 挂载之前, 调用一次
- render: return一个React组件(即UI), 不负责组件实际渲染工作, 是纯函数
- componentDidMount: 组件挂载到DOM后调用, 且只会被调用一次

组件的更新(update)阶段:

- componentWillReceiveProps(nextProps)
- shouldComponentUpdate(nextProps, nextState)
  - 此方法通过比较nextProps，nextState及当前组件的this.props，this.state，返回true时当前组件将继续执行更新过程，返回false则当前组件更新停止，以此可用来减少组件的不必要渲染，优化组件性能。ps：这边也可以看出，就算componentWillReceiveProps()中执行了this.setState，更新了state，但在render前（如shouldComponentUpdate，componentWillUpdate），this.state依然指向更新前的state，不然nextState及当前组件的this.state的对比就一直是true了。
- componentWillUpdate(nextProps, nextState)
- render
- componentDidUpdate(prevProps, prevState)

造成组件更新的三种情况:

- 父组件重新render
  - 父组件重新render导致的重传props, 子组件跟着渲染, 可以通过shoudComponentUpdate方法优化
  - 在componentWillReceiveProps方法中, setState
- 组件本身调用setState, 可以通过shouldComponentUpdate

卸载阶段: componentWillUnmount

### v16新生命周期

[reactFiber](https://zhuanlan.zhihu.com/p/26027085)

getDerivedStateFromProps(props, state) 在组件创建时和更新时的render方法之前调用，它应该返回一个对象来更新状态，或者返回null来不更新任何内容。

getSnapshotBeforeUpdate() 被调用于render之后，可以读取但无法使用DOM的时候。它使您的组件可以在可能更改之前从DOM捕获一些信息（例如滚动位置）。此生命周期返回的任何值都将作为参数传递给componentDidUpdate（）。