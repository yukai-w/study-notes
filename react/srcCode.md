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


