# js设计模式
`<<javascript设计模式与开发>>`

## 什么是设计模式
设计模式的定义: 在面向对象软件设计过程中针对特定问题的简介而优雅的解决方案.
> 通俗一点说, 设计模式是在某种场合下对某个问题的一种解决方案.

## 原型模式
原型模式是一种模式, 也是一种编程的泛型, 它构成了javascript这门语言的根本
```javascript
var Plane = function() {
  this.blood = 10;
};
var p = new Plane();
var newP = Object.create(p);
console.log(newP.blood); // 10
```
> js中的原型链可以向上查找, 原型继承也是其特性

# 设计模式detail
假设需求: 有A,B,C,D四种计算方法, `y(输出) = x(输入) * n`, 其中A(n=2),B(n=4),C(n=6),D(n=8).

## 1.单例模式
> 定义: 保证一个类仅有一个实例, 并提供一个访问它的全局访问点.
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
```

## 2.策略模式
> 定义: 定义一系列的算法, 把它们一个个封装起来, 并且使它们可以相互替换.
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
-------> [使用策略模式实现缓动动画]()

