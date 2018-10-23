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

相关代码：
```javascript
/**
 * Given a ReactNode, create an instance that will actually be mounted.
 *
 * @param {ReactNode} node
 * @return {object} A new instance of the element's constructor.
 * @protected
 */
function instantiateReactComponent(node) {
  var instance;

  // 空组件
  if (node === null || node === false) {
    instance = ReactEmptyComponent.create(instantiateReactComponent);
  } else if (typeof node === 'object') {
    var element = node;
    invariant(
      element && (typeof element.type === 'function' ||
                  typeof element.type === 'string'),
      'Element type is invalid: expected a string (for built-in components) ' +
      'or a class/function (for composite components) but got: %s.%s',
      element.type == null ? element.type : typeof element.type,
      getDeclarationErrorAddendum(element._owner)
    );

    // Special case string values
    if (typeof element.type === 'string') {
      // dom标签
      instance = ReactNativeComponent.createInternalComponent(element);
    } else if (isInternalComponentType(element.type)) {
      // This is temporarily available for custom components that are not string
      // representations. I.e. ART. Once those are updated to use the string
      // representation, we can drop this code path.
      // 不是字符串表示的自定义组件暂无法使用， 此处将不做初始化操作
      instance = new element.type(element);
    } else {
      // 自定义组件
      instance = new ReactCompositeComponentWrapper(element);
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    // 字符串或者数字
    instance = ReactNativeComponent.createInstanceForText(node);
  } else {
    invariant(
      false,
      'Encountered invalid React node of type %s',
      typeof node
    );
  }

  if (__DEV__) {
    warning(
      typeof instance.mountComponent === 'function' &&
      typeof instance.receiveComponent === 'function' &&
      typeof instance.getNativeNode === 'function' &&
      typeof instance.unmountComponent === 'function',
      'Only React Components can be mounted.'
    );
  }

  // These two fields are used by the DOM and ART diffing algorithms
  // respectively. Instead of using expandos on components, we should be
  // storing the state needed by the diffing algorithms elsewhere.
  // 初始化参数
  instance._mountIndex = 0;
  instance._mountImage = null;

  if (__DEV__) {
    instance._isOwnerNecessary = false;
    instance._warnedAboutRefsInRender = false;
  }

  // Internal instances should fully constructed at this point, so they should
  // not get any new fields added to them at this point.
  if (__DEV__) {
    if (Object.preventExtensions) {
      Object.preventExtensions(instance);
    }
  }

  return instance;
}
```

### 文本组件

在执行mountComponent方式时， ReactDOMTextComponent通过transaction.useCreateElement判断是否通过createElement方式创建的节点， 如果是， 则添加domID拥有diff权力，如果不是，则直接返回文本内容。

相关代码：
```javascript
var ReactDOMTextComponent = function(text) {
  // TODO: This is really a ReactText (ReactNode), not a ReactElement
  // 保存当前字符串
  this._currentElement = text;
  this._stringText = '' + text;
  // ReactDOMComponentTree uses these:
  this._nativeNode = null;
  this._nativeParent = null;

  // Properties
  this._domID = null;
  this._mountIndex = 0;
  this._closingComment = null;
  this._commentNodes = null;
};

assign(ReactDOMTextComponent.prototype, {

  /**
   * Creates the markup for this text node. This node is not intended to have
   * any features besides containing text content.
   *
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @return {string} Markup for this text node.
   * @internal
   */
  mountComponent: function(
    transaction,
    nativeParent,
    nativeContainerInfo,
    context
  ) {
    if (__DEV__) {
      var parentInfo;
      if (nativeParent != null) {
        parentInfo = nativeParent._ancestorInfo;
      } else if (nativeContainerInfo != null) {
        parentInfo = nativeContainerInfo._ancestorInfo;
      }
      if (parentInfo) {
        // parentInfo should always be present except for the top-level
        // component when server rendering
        validateDOMNesting('#text', this, parentInfo);
      }
    }

    var domID = nativeContainerInfo._idCounter++;
    var openingValue = ' react-text: ' + domID + ' ';
    var closingValue = ' /react-text ';
    this._domID = domID;
    this._nativeParent = nativeParent;

    // 如果是createElement 则会加上标签和domID
    if (transaction.useCreateElement) {
      var ownerDocument = nativeContainerInfo._ownerDocument;
      var openingComment = ownerDocument.createComment(openingValue);
      var closingComment = ownerDocument.createComment(closingValue);
      var lazyTree = DOMLazyTree(ownerDocument.createDocumentFragment());
      // 开始标签
      DOMLazyTree.queueChild(lazyTree, DOMLazyTree(openingComment));
      // 如果是文本类型，则创建文本节点
      if (this._stringText) {
        DOMLazyTree.queueChild(
          lazyTree,
          DOMLazyTree(ownerDocument.createTextNode(this._stringText))
        );
      }
      DOMLazyTree.queueChild(lazyTree, DOMLazyTree(closingComment));
      ReactDOMComponentTree.precacheNode(this, openingComment);
      this._closingComment = closingComment;
      return lazyTree;
    } else {
      var escapedText = escapeTextContentForBrowser(this._stringText);

      // 静态页面下直接返回文本节点
      if (transaction.renderToStaticMarkup) {
        // Normally we'd wrap this between comment nodes for the reasons stated
        // above, but since this is a situation where React won't take over
        // (static pages), we can simply return the text as it is.
        return escapedText;
      }

      return (
        '<!--' + openingValue + '-->' + escapedText +
        '<!--' + closingValue + '-->'
      );
    }
  },

  /**
   * Updates this component by updating the text content.
   *
   * @param {ReactText} nextText The next text content
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  // 更新文本内容
  receiveComponent: function(nextText, transaction) {
    if (nextText !== this._currentElement) {
      this._currentElement = nextText;
      var nextStringText = '' + nextText;
      if (nextStringText !== this._stringText) {
        // TODO: Save this as pending props and use performUpdateIfNecessary
        // and/or updateComponent to do the actual update for consistency with
        // other component types?
        this._stringText = nextStringText;
        var commentNodes = this.getNativeNode();
        DOMChildrenOperations.replaceDelimitedText(
          commentNodes[0],
          commentNodes[1],
          nextStringText
        );
      }
    }
  },

  getNativeNode: function() {
    var nativeNode = this._commentNodes;
    if (nativeNode) {
      return nativeNode;
    }
    if (!this._closingComment) {
      var openingComment = ReactDOMComponentTree.getNodeFromInstance(this);
      var node = openingComment.nextSibling;
      while (true) {
        invariant(
          node != null,
          'Missing closing comment for text component %s',
          this._domID
        );
        if (node.nodeType === 8 && node.nodeValue === ' /react-text ') {
          this._closingComment = node;
          break;
        }
        node = node.nextSibling;
      }
    }
    nativeNode = [this._nativeNode, this._closingComment];
    this._commentNodes = nativeNode;
    return nativeNode;
  },

  unmountComponent: function() {
    this._closingComment = null;
    this._commentNodes = null;
    ReactDOMComponentTree.uncacheNode(this);
  },

});
```

### DOM标签组件

React的处理并不是直接操作和污染原生DOM，这样不仅保持了性能上的高校和稳定，而且降低了直接操作原生DOM而导致错误的风险。

ReactDOMComponent针对Virtual DOM 标签的处理主要分为以下两个部分：
- 属性的更新，包括样式、更新属性、处理事件等；
- 子节点的更新，包括更新内容、更新子节点，此部分涉及diff算法。

#### 更新属性

初始化:
- 如果存在事件, 则针对当前节点添加事件代理
- 如果存在样式, 首先会对样式进行合并操作`Object.assign({}, props.style), 然后创建样式
- 然后创建属性
- 最后创建唯一标识

更新操作:
- 先删除不需要的旧属性.
  - 如果不需要旧样式, 则遍历旧样式集合, 并对每个样式进行置空删除
  - 如果不需要事件, 则将其事件监听的属性去掉, 及取消事件代理
- 更新新属性
  - 如果存在新样式, 则将新样式进行合并
  - 如果在旧样式中但不在新样式中, 则清除该样式
  - 如果既在旧样式中也在新样式中, 且不相同, 则更新该样式`styleUpdates[styleName] = nextProp[styleName]`
  - 如果存在信阳市中, 但不在旧样式中, 则直接更新为新样式
  - 如果存在事件更新, 则添加事件监听的属性
  - 如果存在新属性, 则添加新属性或者更新旧的同名属性

相关代码:
```javascript
_updateDOMProperties: function(lastProps, nextProps, transaction) {
    var propKey;
    var styleName;
    var styleUpdates;
    for (propKey in lastProps) {
      if (nextProps.hasOwnProperty(propKey) ||
         !lastProps.hasOwnProperty(propKey) ||
         lastProps[propKey] == null) {
        continue;
      }
      // 从DOM上删除不需要的样式
      if (propKey === STYLE) {
        var lastStyle = this._previousStyleCopy;
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {};
            styleUpdates[styleName] = '';
          }
        }
        this._previousStyleCopy = null;
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (lastProps[propKey]) {
          // Only call deleteListener if there was a listener previously or
          // else willDeleteListener gets called when there wasn't actually a
          // listener (e.g., onClick={null})
          // 取消事件监听
          deleteListener(this, propKey);
        }
      } else if (this._namespaceURI === DOMNamespaces.svg) {
        // 从 DOM 上删除不需要的属性 svg
        DOMPropertyOperations.deleteValueForSVGAttribute(
          getNode(this),
          propKey
        );
      } else if (
        // 从 DOM 上删除不需要的属性 
          DOMProperty.properties[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        DOMPropertyOperations.deleteValueForProperty(getNode(this), propKey);
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey];
      var lastProp =
        propKey === STYLE ? this._previousStyleCopy :
        lastProps != null ? lastProps[propKey] : undefined;
      // 不在新属性中 或与旧属性相同 则跳过
      if (!nextProps.hasOwnProperty(propKey) ||
          nextProp === lastProp ||
          nextProp == null && lastProp == null) {
        continue;
      }
      // 在DOM 上写入新样式
      if (propKey === STYLE) {
        if (nextProp) {
          if (__DEV__) {
            checkAndWarnForMutatedStyle(
              this._previousStyleCopy,
              this._previousStyle,
              this
            );
            this._previousStyle = nextProp;
          }
          nextProp = this._previousStyleCopy = assign({}, nextProp);
        } else {
          this._previousStyleCopy = null;
        }
        if (lastProp) {
          // Unset styles on `lastProp` but not on `nextProp`.
          // 在旧样式中且不在新样式中, 清除该样式
          for (styleName in lastProp) {
            if (lastProp.hasOwnProperty(styleName) &&
                (!nextProp || !nextProp.hasOwnProperty(styleName))) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
          // Update styles that changed since `lastProp`.
          // 既在就样式中也在新样式中 且不相同
          for (styleName in nextProp) {
            if (nextProp.hasOwnProperty(styleName) &&
                lastProp[styleName] !== nextProp[styleName]) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        } else {
          // Relies on `updateStylesByID` not mutating `styleUpdates`.
          // 不存在旧样式 直接写入新样式
          styleUpdates = nextProp;
        }
      } else if (registrationNameModules.hasOwnProperty(propKey)) {
        if (nextProp) {
          // 添加事件监听
          enqueuePutListener(this, propKey, nextProp, transaction);
        } else if (lastProp) {
          deleteListener(this, propKey);
        }
      } else if (isCustomComponent(this._tag, nextProps)) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          // 更新新属性
          DOMPropertyOperations.setValueForAttribute(
            getNode(this),
            propKey,
            nextProp
          );
        }
      } else if (this._namespaceURI === DOMNamespaces.svg) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          DOMPropertyOperations.setValueForSVGAttribute(
            getNode(this),
            propKey,
            nextProp
          );
        }
      } else if (
          DOMProperty.properties[propKey] ||
          DOMProperty.isCustomAttribute(propKey)) {
        var node = getNode(this);
        // If we're updating to null or undefined, we should remove the property
        // from the DOM node instead of inadvertently setting to a string. This
        // brings us in line with the same behavior we have on initial render.
        if (nextProp != null) {
          // 如果属性不为空, 设置属性
          DOMPropertyOperations.setValueForProperty(node, propKey, nextProp);
        } else {
          // 如果属性为空, 则删除该属性
          DOMPropertyOperations.deleteValueForProperty(node, propKey);
        }
      }
    }
    if (styleUpdates) {
      CSSPropertyOperations.setValueForStyles(
        getNode(this),
        styleUpdates,
        this
      );
    }
  },
```

#### 更新子节点

首先, 获取节点内容 props.dangerouslySetInnerHTML. 如果存在子节点, 则对子节点进行初始化渲染.

```javascript
  _createInitialChildren: function(transaction, props, context, lazyTree) {
    // Intentional use of != to avoid catching zero/false.
    // 获取dangerouslySetInnerHTML
    var innerHTML = props.dangerouslySetInnerHTML;
    if (innerHTML != null) {
      if (innerHTML.__html != null) {
        DOMLazyTree.queueHTML(lazyTree, innerHTML.__html);
      }
    } else {
      var contentToUse =
        CONTENT_TYPES[typeof props.children] ? props.children : null;
      var childrenToUse = contentToUse != null ? null : props.children;
      if (contentToUse != null) {
        // TODO: Validate that text is allowed as a child of this node
        DOMLazyTree.queueText(lazyTree, contentToUse);
      } else if (childrenToUse != null) {
        // 对子节点开始渲染
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction,
          context
        );
        for (var i = 0; i < mountImages.length; i++) {
          DOMLazyTree.queueChild(lazyTree, mountImages[i]);
        }
      }
    }
  },
```

当执行receiveComponent方式时, ReactDOMComponent会更新DOM内容和子节点:
- 先删除不需要的子节点和内容.
  - 如果旧节点存在, 而新节点不存在, 说明当前节点在更新后被删除, 此时执行this.updateChildren(null, transaction, context)
  - 如果旧的内容存在, 而新的不存在, 说明当前内容在更新后被删除, 执行方法this.updateTextContent('')
- 再是更新子节点和内容
  - 如果新子节点存在, 则更新其子节点
  - 如果新内容存在, 则更新内容

相关代码:
```javascript
_updateDOMChildren: function(lastProps, nextProps, transaction, context) {
  // 初始化
  var lastContent =
    CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
  var nextContent =
    CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;

  var lastHtml =
    lastProps.dangerouslySetInnerHTML &&
    lastProps.dangerouslySetInnerHTML.__html;
  var nextHtml =
    nextProps.dangerouslySetInnerHTML &&
    nextProps.dangerouslySetInnerHTML.__html;

  // Note the use of `!=` which checks for null or undefined.
  var lastChildren = lastContent != null ? null : lastProps.children;
  var nextChildren = nextContent != null ? null : nextProps.children;

  // If we're switching from children to content/html or vice versa, remove
  // the old content
  var lastHasContentOrHtml = lastContent != null || lastHtml != null;
  var nextHasContentOrHtml = nextContent != null || nextHtml != null;
  if (lastChildren != null && nextChildren == null) {
    // 旧节点存在, 而新节点不存在, 说明当前节点更新后被删除了
    this.updateChildren(null, transaction, context);
  } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
    // 内容更新后被删除了
    this.updateTextContent('');
  }

  // 新节点存在
  if (nextContent != null) {
    if (lastContent !== nextContent) {
      this.updateTextContent('' + nextContent);
    }
  } else if (nextHtml != null) {
    if (lastHtml !== nextHtml) {
      this.updateMarkup('' + nextHtml);
    }
  } else if (nextChildren != null) {
    // 更新子节点
    this.updateChildren(nextChildren, transaction, context);
  }
},
```

## 生命周期管理艺术

React主要思想是通过构建可复用组件来构建用户界面. 所谓组件, 其实就是`有限状态机(FSM)`. 就是表示有限个状态以及在这些状态之间的转移和动作等行为的模型.

组件的生命周期在不同状态下的执行顺序:
- 当首次挂载组件时, 按顺序执行`getDefaultProps`, `getInitialState`, `componentWillMount`, `render`和`componentDidMount`;
- 当卸载组件时, 执行`componentWillUnmount`;
- 当重新挂载组件时, 此时按顺序执行`getInitialState`, `componentWillMount`, `render`和`componentDidMount`, 但不执行`getDefaultProps`;
- 当再次渲染组件时, 组件接收到更新状态, 此时按顺序执行`componentWillReceiveProps`, `shouldComponentUpdate`, `componentWillUpdate`, `render`和`componentDidUpdate`.

### 阶段一: MOUNTING

mountComponent负责管理生命周期中的getInitialState, componentWillMount, render和componentDidMount

> 其实, mountComponent本质上是通过`递归`渲染内容的, 由于递归的特性, **父组件的componentWillMount在子组件componentWillMount之前, 而父组件的componentDidMount再其子组件的componentDidMount之后调用**

### 阶段二: RECEIVE_PROPS

updateComponent 负责管理生命周期中的`componengWillReceiveProps`, `shouldComponentUpdate`, `componentWillUpdate`, `render`和`componentDidUpdate`.

> updateComponent 也是通过递归渲染

### 阶段三: UNMOUNTING

unmountComponent负责管理生命周期中的componentWillUnmount

## 解密setState机制

setState通过一个队列机制实现state更新, 当执行setState时, 会将需要更新的state合并后放入状态队列, 而不会立刻更新this.state.

### setState 调用战

setState最终是通过enqueueUpdate执行state更新。

```javascript
import React, { Component } from 'react';

class Example extends Component {
  constructor() {
    super();
    this.state = {
      val: 0,
    };
  }

  componentWillMount() {
    this.setState({ val: this.state.val + 1 });
    console.log(this.state.val); // 第1次输出

    this.setState({ val: this.state.val + 1 });
    console.log(this.state.val); // 第2次输出

    setTimeout(() => {
      this.setState({ val: this.state.val + 1 });
      console.log(this.state.val); // 第3次输出

      this.setState({ val: this.state.val + 1 });
      console.log(this.state.val); // 第4次输出
    })
  }

  render() {
    return null;
  }

  // 输出 0  0  2  3
}
```

为什么？？？？？？？

```flow
st=>start: this.setState(newState)
e=>end: 登录 
         ||
`newState`存入pending队列
         ||
调用`enqueueUpdate`
```
<div style="width: 100px;height:100px;background: red;border-radius:50px;"></div>

