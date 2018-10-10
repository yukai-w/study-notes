// set
let s = new Set(['a', 'b', 'c']);
// 唯一  可过滤NAN
s.add(1).add(2).add(2);

s.delete('b'); // 返回删除是否成功

s.has('b');

s.clear();

s.forEach(function(item, index, set) {

});

s.keys(); // return keys itetor


