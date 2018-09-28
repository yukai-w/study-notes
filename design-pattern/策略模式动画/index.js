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