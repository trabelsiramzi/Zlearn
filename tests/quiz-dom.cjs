const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {JSDOM} = require("jsdom");
const root = path.resolve(__dirname, "..");

function boot(relative) {
  const file = path.join(root, "site", relative);
  const html = fs.readFileSync(file, "utf8");
  const dom = new JSDOM(html, {runScripts:"outside-only", pretendToBeVisual:true, url:"http://localhost/"+relative, beforeParse(w){w.scrollTo=function(){};}});
  const w = dom.window;
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"\s*><\/script>/g)];
  scripts.forEach(match => {
    const asset = path.resolve(path.dirname(file), match[1]);
    w.eval(fs.readFileSync(asset, "utf8"));
  });
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", {bubbles:true}));
  return dom;
}

const lesson = boot("nahw/01-lesson/index.html");
const doc = lesson.window.document;
function neverBody(label) {
  assert.notStrictEqual(doc.activeElement, doc.body, "focus is not on BODY after " + label);
}
const first = doc.querySelector("[data-pretest] .study-card");
assert(first, "lesson renders pretest questions");
const response = first.querySelector("textarea");
const attempted = [...first.querySelectorAll("button")].find(b => b.textContent === "سجّلت محاولتي");
assert(attempted.disabled, "answer is required before continuing");
response.value = "محاولة إجابة";
response.dispatchEvent(new lesson.window.Event("input", {bubbles:true}));
assert(!attempted.disabled);
attempted.click();
neverBody("recording the attempt");
const confident = [...first.querySelectorAll("button")].find(b => b.textContent === "واثق");
assert(confident, "confidence is requested after the answer");
confident.click();
neverBody("choosing confidence");
assert(first.textContent.includes("الإجابة النموذجية"));
const correct = [...first.querySelectorAll("button")].find(b => b.textContent === "نعم، إجابتي صحيحة");
correct.click();
neverBody("self-assessment");
const questionId = JSON.parse(doc.getElementById("lesson-question-data").textContent)[0].id;
const card = lesson.window.ZLEARN_STORAGE.getState().cards[questionId];
assert.strictEqual(card.box, 2);
assert.strictEqual(card.due, lesson.window.ZLEARN_SRS.shiftDate(new Date().getFullYear()+"-"+("0"+(new Date().getMonth()+1)).slice(-2)+"-"+("0"+new Date().getDate()).slice(-2), 3));
const second = doc.querySelectorAll("[data-pretest] .study-card")[1];
second.querySelector("textarea").value = "محاولة ثانية";
second.querySelector("textarea").dispatchEvent(new lesson.window.Event("input", {bubbles:true}));
second.querySelector("button").click();
[...second.querySelectorAll("button")].find(b => b.textContent === "واثق").click();
[...second.querySelectorAll("button")].find(b => b.textContent === "أحتاج إلى مراجعة").click();
neverBody("second self-assessment");
assert.strictEqual(doc.querySelectorAll("[data-pretest] .study-card").length, 3, "high-confidence failure returns later in this session");
lesson.window.close();

// Phase 2 : micro-questions montées après leur section de cours + clôture confirmée.
const phase2 = boot("akhlaq/01-lesson/index.html");
const p2 = phase2.window.document;
const host = p2.querySelector('[data-checkpoint="ak1-context"]');
assert(host, "course section has a checkpoint mount");
assert.strictEqual(host.querySelectorAll(".study-card").length, 2, "micro-questions mount in the checkpoint host");
assert.strictEqual(p2.querySelectorAll("[data-practice] .study-card").length, 6, "remaining cards stay in the closure session");
const micro = host.querySelector(".study-card");
function answer(card) {
  const ta = card.querySelector("textarea");
  if (!ta.disabled) { ta.value = "الجواب"; ta.dispatchEvent(new phase2.window.Event("input", {bubbles:true})); }
  const attempt = [...card.querySelectorAll("button")].find(b => b.textContent === "سجّلت محاولتي");
  if (attempt && !attempt.disabled) attempt.click();
  const sure = [...card.querySelectorAll("button")].find(b => b.textContent === "واثق");
  if (sure) sure.click();
  const ok = [...card.querySelectorAll("button")].find(b => b.textContent === "نعم، إجابتي صحيحة");
  if (ok) ok.click();
}
answer(micro);
assert.notStrictEqual(p2.activeElement, p2.body, "focus is not on BODY on a checkpoint card");
const secondMicro = host.querySelectorAll(".study-card")[1];
assert(secondMicro.contains(p2.activeElement), "focus moves to the next micro-question in the same section");
answer(secondMicro);
const adab = p2.querySelector('[data-checkpoint="ak1-adab"]');
assert(adab.contains(p2.activeElement), "focus crosses to the next section's micro-question");
// Answer every remaining card; the closure confirmation must appear at the end.
let guard = 0;
while (guard++ < 60) {
  const card = [...p2.querySelectorAll(".study-card")].find(c => {
    const btn = [...c.querySelectorAll("button")].find(b => b.textContent === "سجّلت محاولتي");
    return btn && !btn.hidden;
  });
  if (!card) break;
  answer(card);
}
const confirm = p2.querySelector("[data-review-confirm]");
assert(confirm && !confirm.hidden, "closure confirms the cards were added to review");
assert(confirm.textContent.includes("أُضيفت للمراجعة"), "confirmation names the review session");
assert(confirm.textContent.includes("أقرب مراجعة"), "confirmation shows the next review date");
phase2.window.close();

const review = boot("review/index.html");
const w = review.window;
const state = w.ZLEARN_STORAGE.getState();
const dueToday = w.ZLEARN_SRS.shiftDate(new Date().getFullYear()+"-"+("0"+(new Date().getMonth()+1)).slice(-2)+"-"+("0"+new Date().getDate()).slice(-2),0);
state.cards[questionId] = {box:2,due:dueToday,history:[1]};
w.ZLEARN_STORAGE.setState(state);
w.ZLEARN_QUIZ.renderOne = function(host, q){const p=w.document.createElement("p");p.textContent=q.id;host.appendChild(p);};
w.document.dispatchEvent(new w.Event("DOMContentLoaded", {bubbles:true}));
assert.strictEqual(w.document.querySelectorAll("[data-review-list] .review-item").length, 1, "due card appears in mixed review");
assert.strictEqual(w.document.querySelector("[data-review-count]").textContent, "1");
review.window.close();
console.log("quiz DOM flow passed");
