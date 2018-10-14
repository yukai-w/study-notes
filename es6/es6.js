// set
let s = new Set(['a', 'b', 'c']);
// 唯一  可过滤NAN
s.add(1).add(2).add(2);

s.delete('b'); // 返回删除是否成功

s.has('b');

s.clear();

s.forEach(function(item, index, set) {

});

s.keys(); // return keys iterator


// map



// class 类  

// str
let str = 'sdf';
str.indexOf('s'); // es5
str.includes('s'); // es6  =>  true / false

str.startsWith('s'); // true / false
str.endsWith('d');

str.repeat(2); // sdfsdf

let str1 = `ff${str}ff
      ddddd`;

// arr
let arr = [1,2,3];
Array.of(1,2,3);
Array.from(document.getElementsByClassName('ss'));
arr.find(item => item > 1);

// promise
let pro = new Promise((resolve, reject) => {
    resolve('ddd');
});
pro.then(s => console.log(s)) // 'ddd'

