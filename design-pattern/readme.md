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

