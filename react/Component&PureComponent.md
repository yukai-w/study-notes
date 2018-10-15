## 两者区别

- `PureComponent` 在 `shouldComponentUpdate()` 生命周期里进行浅对比
- 而 `Component` 在 `shoudComponentUpdate()` 进行深对比
- `PureCompnent` 默认子组件也是 `pure` 的