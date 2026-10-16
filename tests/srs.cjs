const assert = require("assert");
const srs = require("../src/js/srs.js");
const day = "2026-10-15";
assert.deepStrictEqual(srs.intervals, [1, 3, 7, 14, 30]);
assert.strictEqual(srs.grade(null, true, "sure", day).box, 2);
assert.strictEqual(srs.grade(null, true, "sure", day).due, "2026-10-18");
assert.strictEqual(srs.grade({box:3,history:[1]}, true, "hesitant", day).box, 3);
assert.strictEqual(srs.grade({box:3}, true, "hesitant", day).due, "2026-10-22");
assert.strictEqual(srs.grade({box:5}, true, "sure", day).due, "2026-11-14");
assert.strictEqual(srs.grade({box:4}, true, "guessed", day).box, 1);
assert.strictEqual(srs.grade({box:4}, false, "sure", day).due, "2026-10-16");
const catalog = [
  {question:{id:"a",section:"s"},subject:"aqida"},
  {question:{id:"b",section:"s"},subject:"fiqh"},
  {question:{id:"c",section:"s"},subject:"aqida"},
  {question:{id:"d",section:"s"},subject:"fiqh"},
  {question:{id:"e",section:"s"},subject:"nahw"}
];
const due = srs.dueCards(catalog,{cards:{a:{due:day},b:{due:day},c:{due:day},d:{due:"2026-10-14"},e:{due:day}}},day,20);
assert.deepStrictEqual(due.map(x=>x.question.id),["d","a","e","b","c"]);
assert.strictEqual(srs.dueCards(catalog,{cards:{a:{due:day}}},day,20).length,1);
const many = Array.from({length:25},(_,i)=>({question:{id:"q"+i},subject:"s"+(i%4)}));
const manyState={cards:{}}; many.forEach(x=>{manyState.cards[x.question.id]={due:day};});
assert.strictEqual(srs.dueCards(many,manyState,day,20).length,20,"review session is capped at 20 cards");
assert.strictEqual(srs.soonestDue({a:{due:"2026-10-20"},b:{due:"2026-10-16"},c:{due:"2026-11-01"}}), "2026-10-16");
assert.strictEqual(srs.soonestDue({}), "");
assert.strictEqual(srs.soonestDue({a:{box:1}}), "");
console.log("srs tests passed");
