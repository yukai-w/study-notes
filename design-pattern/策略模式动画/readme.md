# 设计模式之`策略模式`实现缓动动画

## 什么是策略模式?
说到设计模式, 一般人(像我一样的新鸟们)首先想到的是`单例模式!`. 哇, 单例模式又是什么? ....^*&^*%^
> 假设有个需求: 有A,B,C,D四种计算方法, `y(输出) = x(输入) * n`, 其中A(n=2),B(n=4),C(n=6),D(n=8).

使用单例模式如下: 
```javascript
var obj = (function() {
  var logA = function(x) {
    console.log(x * 2);
  };
  var logB = function(x) {
    console.log(x * 4);
  };
  var logC = function(x) {
    console.log(x * 6);
  };
  var logD = function(x) {
    console.log(x * 8);
  };

  return {
    logA: logA,
    logB: logB,
    logC: logC,
    logD: logD,
  }
})();

obj.logA(2); // 4
// 这么做的话, 会保证一个类仅有一个实例, 并提供一个访问它的全局访问点.
```
> 但是问题来了, 如果我有成百上千的方法, 会特别难维护.

### 正式介绍策略模式
> 定义: 定义一系列的算法, 把它们一个个封装起来, 并且使它们可以相互替换.
不太懂?没关系, 先上代码!
```javascript
var logTypes = {
  A: function(x) {
    console.log(x * 2);
  },
  B: function(x) {
    console.log(x * 4);
  },
  C: function(x) {
    console.log(x * 6);
  },
  D: function(x) {
    console.log(x * 8);
  },
};
var log = function(type, x) {
  logTypes[type](x);
};

log('A', 20); // 40
```
有什么区别? 就只是多了个入口, 但是我们真正内部方法会被封装起来, 使用的时候交给`log`函数, 它就负责托管, 负责计算的逻辑放在顶部`logTypes`中.
所以策略模式的关键在于`托管`, 一个派发器, 分发给不同的算法.(类似redux)

## 基于策略模式实现缓动动画
让我们优雅地让`div`乱飞吧!

### 动画方法分析
- 各种动画运动函数, `tween`对象
- 初始化目标位置和信息, `Animate`类(假装是个类)
- 因为基于策略模式, 需要有一个托管入口, `start`函数
- 动画是一帧一帧组成的, 所以还需要一个`step`函数来计算每一帧
- 最后进行dom操作, 需要`update`函数

### 代码来了~
```javascript
/**
 * @desc 定义一系列算法, 均接收4个参数
 * @param t 动画已消耗的时间
 * @param b 小球原始的位置
 * @param c 小球的目标位置
 * @param d 动画持续的总时间
 */
var tween = {
  linear: function(t, b, c, d) {
    return c * t / d + b;
  },
  easeIn: function(t, b, c, d) {
    return c * (t /= d) * t + b;
  },
  strongEaseIn: function(t, b, c, d) {
    return c * (t /= d) * t * t * t * t + b;
  },
  strongEaseOut: function(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
  },
  sineaseIn: function(t, b, c, d) {
    return c * (t /= d) * t * t + b;
  },
  sineaseOut: function(t, b, c, d) {
    return c * ((t = t / d - 1) * t * t + 1) + b;
  },
}

/**
 * @desc Animate类
 */
var Animate = function(dom) {
  this.dom = dom;
  this.startTime = 0;
  this.startPos = 0; // 运动开始时候dom初始位置
  this.endPos = 0; // 目标位置
  this.propertyName = null; // dom节点需要被改变的css属性名
  this.easing = null; // 缓动算法
  this.duration = null; // 持续时间
};

/**
 * @desc 在Animate原型上添加start方法, 启动动画
 * @param propertyName 要改变的css属性名, 如: left
 * @param endPos 小球运动的目标位置
 * @param duration 动画持续时间
 * @param easing 缓动算法
 */
Animate.prototype.start = function(propertyName, endPos, duration, easing) {
  this.startTime = +new Date; // 动画启动时间
  this.startPos = this.dom.getBoundingClientRect()[propertyName];
  this.propertyName = propertyName;
  this.endPos = endPos;
  this.duration = duration;
  this.easing = tween[easing];

  var self = this;
  var timeId = setInterval(function() {
    if (self.step() === false) {
      clearInterval(timeId);
    }
  }, 19);
};

/**
 * @desc 小球运动每一帧需要做的事情
 */
Animate.prototype.step = function() {
  var t = +new Date; // 取得当前时间
  if (t >= this.startTime + this.duration) {
    this.update(this.endPos); // 更新小球的css属性值
    return false;
  }
  var pos = this.easing(t - this.startTime, this.startPos,
    this.endPos - this.startPos, this.duration);
  // pos为小球当前位置
  this.update(pos);
}
/**
 * @desc 操作dom, 改变小球位置
 */
Animate.prototype.update = function(pos) {
  this.dom.style[this.propertyName] = pos + 'px';
}

```
> 源码地址: [github](https://github.com/yukai-w/study-notes/blob/master/design-pattern/%E7%AD%96%E7%95%A5%E6%A8%A1%E5%BC%8F%E5%8A%A8%E7%94%BB/index.js)