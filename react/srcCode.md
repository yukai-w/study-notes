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

## Virtual DOM 模型

构建一套简易 Virtual DOM 模型并不复杂, 它需要具备一个DOM标签所需的基本元素即可.
- 标签名;
- 节点属性, 包括样式, 属性, 事件等;
- 子节点;
- 标识id;

示例代码:
```javascript
{
  // 标签名
  tagName: 'div',
  // 属性
  properties: {
    // 样式
    style: {},
  },
  // 子节点
  children: [],
  // 唯一标识
  key: 1,
}
```

Virtual DOM 中节点成为ReactNode, 分为三种类型:
- ReactElement
  - ReactComponentElement
  - ReactDOMElement
- ReactFragment
- ReactText

### 创建React元素

jsx语法:
```javascript
const Nav, Profile;

const app = <Nav color="blue"><Profile>click</Profile></Nav>

// 输出
const app = React.createElement(
  Nav,
  { color: 'blue' },
  React.createElement(Profile, null, 'click')
);
```

createElement具体做了什么??????
```javascript
// createElement只是做了简单的参数修正, 返回一个ReactElement实例对象
// 也就是虚拟元素对象
ReactElement.createElement = function(type, config, children) {
  var propName;

  // Reserved names are extracted
  var props = {};

  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  // 如果config存在, 提取里面的内容
  if (config != null) {
    if (__DEV__) {
      ref = !config.hasOwnProperty('ref') ||
        Object.getOwnPropertyDescriptor(config, 'ref').get ? null : config.ref;
      key = !config.hasOwnProperty('key') ||
        Object.getOwnPropertyDescriptor(config, 'key').get ? null : '' + config.key;
    } else {
      ref = config.ref === undefined ? null : config.ref;
      key = config.key === undefined ? null : '' + config.key;
    }
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (config.hasOwnProperty(propName) &&
          !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // Children can be more than one argument, and those are transferred onto
  // the newly allocated props object.
  // 处理children 全部放入props
  var childrenLength = arguments.length - 2; // 后面参数也可以是children
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  // Resolve default props
  // 将defaultProps放到进props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }
  if (__DEV__) {
    // Create dummy `key` and `ref` property to `props` to warn users
    // against its use
    // 提示用户不可获取key和ref
    if (typeof props.$$typeof === 'undefined' ||
        props.$$typeof !== REACT_ELEMENT_TYPE) {
      if (!props.hasOwnProperty('key')) {
        Object.defineProperty(props, 'key', {
          get: function() {
            if (!specialPropKeyWarningShown) {
              specialPropKeyWarningShown = true;
              warning(
                false,
                '%s: `key` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://fb.me/react-special-props)',
                'displayName' in type ? type.displayName: 'Element'
              );
            }
            return undefined;
          },
          configurable: true,
        });
      }
      if (!props.hasOwnProperty('ref')) {
        Object.defineProperty(props, 'ref', {
          get: function() {
            if (!specialPropRefWarningShown) {
              specialPropRefWarningShown = true;
              warning(
                false,
                '%s: `ref` is not a prop. Trying to access it will result ' +
                  'in `undefined` being returned. If you need to access the same ' +
                  'value within the child component, you should pass it as a different ' +
                  'prop. (https://fb.me/react-special-props)',
                'displayName' in type ? type.displayName: 'Element'
              );
            }
            return undefined;
          },
          configurable: true,
        });
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  );
};
```

### 初始化组件入口

当使用React创建组件时, 首先会调用instantiateReactComponent, 这是初始化组件的入口函数, 通过node类型来区分不同组件的入口.
- 当node为空, 使用ReactEmptyComponent.create(首先会调用instantiateReactComponent);
- 当node为对象类型时, 存在两种情况:
  - 如果element类型为字符串, 则初始化DOM标签组件ReactNativeComponent.createInternalComponent(element);
  - 否则初始化自定义组件ReactCompositeWrapper(); (React混合包装器)
- 当node类型为字符串或数字时, 则初始化文本组件 ReactNativeComponent.createInstanceForText(node);
- 其他情况不做处理

