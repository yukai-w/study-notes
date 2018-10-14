# js异步

- js是单线程
- alert会阻塞线程

## 同步和异步

- 同步代码执行完后, 执行异步队列代码
- setTimeout, setInterval都是异步方法

```javascript
console.log(1);
setTimeout(() => console.log(2));
setTimeout(() => console.log(3));
const p = new Promise((res) => res());
p.then(() => console.log(4));
console.log(5);
// 1 5 4 2 3
```