# 函数柯里化
> currying(柯里化)又称`部分求值`, 一个currying的函数首先会接受一些参数, 接受了这些参数之后, 该函数并不会立即求值, 而是继续返回另一个参数, 刚才传入的参数在函数形成的闭包中被保存起来. 待到函数被真正需要求值的时候, 之前传入的所有参数都会被一次性用于求值.

例子
```javascript
var currying = function(fn) {
  var args = [];
  return function() {
    if (arguments.length === 0) {
      // 将传入参数预留
      return fn.apply(this, args);
    } else {
      [].push.apply(args, arguments);
      return null;
    }
  }
};

var cost = (function() {
  var money = 0;
  
  return function() {
    for (var i = 0, l = arguments.length; i < l; i++) {
      money += arguments[i];
    }
    return money;
  }
})();

var cost = currying(cost); // 转化成currying函数

cost(100);
cost(100);
cost(100); // null

cost(); // 300
```

