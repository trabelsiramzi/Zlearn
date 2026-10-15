const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

function makeStore(seed) {
  const data = Object.assign({}, seed || {});
  return {
    data,
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

const legacy = {
  "mourshid-theme": "dark",
  "mourshid-l1": JSON.stringify({"l1-k1": true, "l1-k2": false}),
  "mourshid-learning-nahw": JSON.stringify({completed:{1:true},lastLesson:1,lastAt:1792022400000}),
  "zlearn-answer-nahw1-activity": "جوابي المحفوظ",
  "mourshid-quiz-nh1-quiz": JSON.stringify({g:{0:"ok",1:"review"}}),
  "mourshid-unrelated": "ignore"
};
const catalog = {
  keys: ["mourshid-theme", "mourshid-l1", "mourshid-learning-nahw", "zlearn-answer-nahw1-activity", "mourshid-quiz-nh1-quiz"],
  lessonKeys: {"nahw:1":"nh1"}, checkIds: {"l1-k1":"nh1-k1", "l1-k2":"nh1-k2"},
  groupIds: {l1:"nh1"}, answerIds: {"nahw1-activity":"nahw1-activity"}, quizIds: {"nh1-quiz":{"0":"nh1-q01","1":"nh1-q02"}}
};
global.ZLEARN_STORAGE_CATALOG = catalog;
global.localStorage = makeStore(legacy);
const storage = require("../src/js/storage.js");
let state = storage.getState();
assert.strictEqual(state.schema, 2);
assert.strictEqual(state.checks["nh1-k1"], true);
assert.strictEqual(state.checks["nh1-k2"], false);
assert.strictEqual(state.lessons.nh1.completedAt.length, 10);
assert.strictEqual(state.answers["nahw1-activity"], "جوابي المحفوظ");
assert.deepStrictEqual(state.cards["nh1-q01"].history, [1]);
assert.deepStrictEqual(state.cards["nh1-q02"].history, [0]);
assert.strictEqual(state.prefs.theme, "dark");
assert.strictEqual(global.localStorage.getItem("mourshid-l1"), legacy["mourshid-l1"]);
const serialized = JSON.stringify(state);
storage.migrate();
assert.strictEqual(JSON.stringify(storage.getState()), serialized, "migration is idempotent");
assert.strictEqual(storage.allowedKey("mourshid-unrelated"), false);
assert.strictEqual(storage.importV1({"mourshid-unrelated":"bad", "mourshid-l1":"not-json"}), true);
assert.strictEqual(storage.getState().checks["nh1-k1"], true, "corrupt v1 values do not erase migrated state");
assert.strictEqual(storage.importV2({format:"zlearn-progress",version:2,data:{schema:2,lessons:{},checks:{},cards:{},answers:{},prefs:{theme:"light"}}}), true);
assert.strictEqual(storage.getState().prefs.theme, "light");
const sandbox = {Date, JSON, Object, Array, String, Number, isNaN, console, ZLEARN_STORAGE_CATALOG:{keys:[]}};
sandbox.window = sandbox;
Object.defineProperty(sandbox, "localStorage", {get(){throw new Error("blocked");}});
vm.runInNewContext(fs.readFileSync(require.resolve("../src/js/storage.js"), "utf8"), sandbox);
sandbox.ZLEARN_STORAGE.setItem("volatile", "memory");
assert.strictEqual(sandbox.ZLEARN_STORAGE.getItem("volatile"), "memory", "memory fallback works when localStorage throws");
console.log("storage migration tests passed");
