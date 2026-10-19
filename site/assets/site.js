/* Stockage versionné Zlearn. Les anciennes clés sont conservées pour permettre un retour arrière. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ZLEARN_STORAGE = api;
}(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this), function (root) {
  "use strict";
  var KEY = "zlearn:v2", memory = {}, nativeStore = null;
  try { nativeStore = root.localStorage; if (nativeStore) { var probe = "__zlearn_probe"; nativeStore.setItem(probe, "1"); nativeStore.removeItem(probe); } } catch (e) { nativeStore = null; }
  function rawGet(k) { try { return nativeStore ? nativeStore.getItem(k) : (Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null); } catch (e) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; } }
  function rawSet(k, v) { v = String(v); memory[k] = v; try { if (nativeStore) nativeStore.setItem(k, v); } catch (e) {} }
  function state() { var s; try { s = JSON.parse(rawGet(KEY) || "null"); } catch (e) { s = null; } return validState(s) ? s : empty(); }
  function empty() { return {schema:2, lessons:{}, checks:{}, cards:{}, answers:{}, prefs:{}}; }
  function validState(s) { return !!s && s.schema === 2 && obj(s.lessons) && obj(s.checks) && obj(s.cards) && obj(s.answers) && obj(s.prefs); }
  function obj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
  function save(s) { if (!validState(s)) return false; rawSet(KEY, JSON.stringify(s)); return true; }
  function today() { var d = new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function dateOf(v) { var d = new Date(v); return isNaN(d.getTime()) ? today() : d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function catalog() { return root.ZLEARN_STORAGE_CATALOG || {keys:[], lessonKeys:{}, checkIds:{}, groupIds:{}, answerIds:{}, quizIds:{}}; }
  function allowed(k) { var a = catalog().keys || []; return a.indexOf(k) !== -1; }
  function migrateValue(s, k, value) {
    var c = catalog(), m, parsed, name, i, mapped;
    if (k === "mourshid-theme") { if (value === "dark" || value === "light") s.prefs.theme = value; return; }
    if (k.indexOf("zlearn-answer-") === 0) { name=k.slice(14); if (c.answerIds[name]) s.answers[c.answerIds[name]]=value; return; }
    if (k.indexOf("mourshid-learning-") === 0) {
      name=k.slice(18); try { parsed=JSON.parse(value); } catch(e) { return; }
      if (!obj(parsed)) return;
      if (obj(parsed.completed)) Object.keys(parsed.completed).forEach(function(n){ mapped=c.lessonKeys[name+":"+n]; if(mapped && parsed.completed[n]) { s.lessons[mapped]=s.lessons[mapped]||{}; if(!s.lessons[mapped].completedAt) s.lessons[mapped].completedAt=today(); }});
      if (parsed.lastLesson != null) { mapped=c.lessonKeys[name+":"+parsed.lastLesson]; if(mapped) { s.lessons[mapped]=s.lessons[mapped]||{}; if(parsed.lastAt) s.lessons[mapped].lastOpened=dateOf(parsed.lastAt); } }
      return;
    }
    if (k.indexOf("mourshid-") === 0 && /-verses$/.test(k)) { name=k.slice(9,-7); mapped=c.answerIds[name+"-verses"]; if(mapped) s.answers[mapped]=value; return; }
    if (k.indexOf("mourshid-quiz-") === 0) {
      name=k.slice(14); try { parsed=JSON.parse(value); } catch(e) { return; }
      if (!obj(parsed) || !obj(parsed.g) || !c.quizIds[name]) return;
      Object.keys(parsed.g).forEach(function(ix){ i=Number(ix); mapped=c.quizIds[name][i]; if(mapped && (parsed.g[ix]==="ok" || parsed.g[ix]==="review")) s.cards[mapped]={box:1,due:today(),history:[parsed.g[ix]==="ok"?1:0]}; }); return;
    }
    if (k.indexOf("mourshid-") === 0) {
      name=k.slice(9); mapped=c.groupIds[name]; if (!mapped) return;
      try { parsed=JSON.parse(value); } catch(e) { return; }
      if (!obj(parsed)) return;
      Object.keys(parsed).forEach(function(id){ var cid=c.checkIds[id]; if(cid) s.checks[cid]=parsed[id] === true; });
    }
  }
  function migrate() {
    var s=state(), c=catalog(), i,k,v,marker="_legacyMigrated";
    if (s.prefs[marker]) return s;
    for(i=0;i<(c.keys||[]).length;i++){ k=c.keys[i]; v=rawGet(k); if(v!==null) migrateValue(s,k,v); }
    s.prefs[marker]=true; save(s); return s;
  }
  function syncLegacy(s) {
    var c=catalog(), reverse={}, groups={}, lessons={}, answers={}, k, old, raw, subject, number;
    Object.keys(c.checkIds||{}).forEach(function(id){reverse[c.checkIds[id]]=id;});
    Object.keys(c.groupIds||{}).forEach(function(id){groups[id]={};});
    Object.keys(s.checks).forEach(function(id){old=reverse[id]; if(old){ Object.keys(c.groupIds||{}).forEach(function(g){if(old.indexOf(g+"-")===0) groups[g][old]=s.checks[id];}); }});
    Object.keys(groups).forEach(function(g){raw="mourshid-"+g; if(allowed(raw)) rawSet(raw,JSON.stringify(groups[g]));});
    Object.keys(c.lessonKeys||{}).forEach(function(pair){var p=pair.split(":"); subject=p[0]; number=p[1]; lessons[subject]=lessons[subject]||{completed:{}}; if(s.lessons[c.lessonKeys[pair]] && s.lessons[c.lessonKeys[pair]].completedAt) lessons[subject].completed[number]=true;});
    Object.keys(lessons).forEach(function(sub){raw="mourshid-learning-"+sub; if(allowed(raw)) rawSet(raw,JSON.stringify(lessons[sub]));});
    Object.keys(c.answerIds||{}).forEach(function(oldId){var target=c.answerIds[oldId]; if(Object.prototype.hasOwnProperty.call(s.answers,target)){raw=oldId.slice(-7)==="-verses"?"mourshid-"+oldId:"zlearn-answer-"+oldId; if(allowed(raw)) rawSet(raw,s.answers[target]);}});
    if(s.prefs.theme) rawSet("mourshid-theme",s.prefs.theme);
  }
  function getItem(k) { var v=rawGet(k); if(v!==null) return v; return null; }
  function setItem(k,v) { rawSet(k,v); var s=state(); if(allowed(k)) { migrateValue(s,k,String(v)); save(s); } }
  function removeItem(k) { /* Anciennes clés restent présentes pour permettre le rollback. */ setItem(k, ""); }
  function importV1(data) { if(!obj(data)) return false; var s=state(); Object.keys(data).forEach(function(k){ if(allowed(k) && typeof data[k]==="string") { rawSet(k,data[k]); migrateValue(s,k,data[k]); } }); save(s); return true; }
  function importV2(input) { var s=input && input.data ? input.data : input; if(!validState(s)) return false; var clean=empty(); Object.keys(s.lessons).forEach(function(k){ if(/^[a-z0-9-]+$/.test(k) && obj(s.lessons[k])) clean.lessons[k]=s.lessons[k]; }); Object.keys(s.checks).forEach(function(k){ if(/^[a-z0-9-]+$/.test(k) && typeof s.checks[k]==="boolean") clean.checks[k]=s.checks[k]; }); Object.keys(s.cards).forEach(function(k){ var c=s.cards[k]; if(/^[a-z0-9-]+$/.test(k) && obj(c) && c.box>=1 && c.box<=5 && /^\d{4}-\d\d-\d\d$/.test(c.due) && Array.isArray(c.history)) clean.cards[k]=c; }); Object.keys(s.answers).forEach(function(k){ if(/^[a-z0-9-]+$/.test(k) && typeof s.answers[k]==="string") clean.answers[k]=s.answers[k]; }); if(s.prefs.theme==="dark" || s.prefs.theme==="light") clean.prefs.theme=s.prefs.theme; save(clean); syncLegacy(clean); return true; }
  migrate();
  return {getItem:getItem,setItem:setItem,removeItem:removeItem,getState:state,setState:save,migrate:migrate,allowedKey:allowed,importV1:importV1,importV2:importV2,exportV2:function(){return {format:"zlearn-progress",version:2,exportedAt:new Date().toISOString(),data:state()};}};
}));

/* Zlearn — script partagé par toutes les pages (ES5, sans dépendance).
   Le manifeste suit séparément les cases de mémorisation (total) et les dars publiés
   (lessons) ; le parcours d'apprentissage ne compte que les leçons terminées. */
var ZLEARN_MATIERES = [
  { id: "fiqh", name: "مادة الفقه", book: "المرشد المعين على الضروري من علوم الدين", file: "fiqh/index.html", total: 35, lessons: 3 },
  { id: "aqida", name: "مادة العقيدة", book: "الشذرات الذهبية", file: "aqida/index.html", total: 41, lessons: 3 },
  { id: "tajwid", name: "مادة التجويد", book: "علم التجويد", file: "tajwid/index.html", total: 46, lessons: 4 },
  { id: "sira", name: "مادة السيرة النبوية", book: "السيرة النبوية منذ المولد إلى الوفاة", file: "sira/index.html", total: 36, lessons: 3 },
  { id: "hadith", name: "مادة الحديث", book: "شرح الأربعين النووية", file: "hadith/index.html", total: 36, lessons: 3 },
  { id: "akhlaq", name: "مادة الأخلاق", book: "تذكرة السامع والمتكلم في أدب العالم والمتعلم", file: "akhlaq/index.html", total: 23, lessons: 3 },
  { id: "nahw", name: "مادة النحو", book: "الدروس النحوية", file: "nahw/index.html", total: 27, lessons: 3 }
];

(function () {
  document.querySelectorAll(".group").forEach(function (g) {
    var gkey = "mourshid-" + g.getAttribute("data-key");
    var gstate = {};
    try { gstate = JSON.parse(ZLEARN_STORAGE.getItem(gkey) || "{}") || {}; } catch (e) { gstate = {}; }
    var boxes = Array.prototype.slice.call(g.querySelectorAll(".check input"));
    var label = g.querySelector(".plabel");
    var fill = g.querySelector(".pfill");
    function update() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      label.textContent = n + " من " + boxes.length;
      fill.style.width = (boxes.length ? (n / boxes.length) * 100 : 0) + "%";
    }
    boxes.forEach(function (b) {
      if (gstate[b.id]) b.checked = true;
      b.addEventListener("change", function () {
        gstate[b.id] = b.checked;
        try { ZLEARN_STORAGE.setItem(gkey, JSON.stringify(gstate)); } catch (e) {}
        update();
      });
    });
    update();
  });

  document.querySelectorAll("textarea[data-key]").forEach(function (ta) {
    var tkey = "mourshid-" + ta.getAttribute("data-key") + "-verses";
    try { var v = ZLEARN_STORAGE.getItem(tkey); if (v) ta.value = v; } catch (e) {}
    ta.addEventListener("input", function () { try { ZLEARN_STORAGE.setItem(tkey, ta.value); } catch (e) {} });
  });
})();


/* Cache hors ligne ; le préfixe respecte les URLs du déploiement GitHub Pages. */
(function () {
  if (!("serviceWorker" in navigator)) return;
  var prefix = document.body.getAttribute("data-site-prefix") || "";
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") return;
  navigator.serviceWorker.register(prefix + "sw.js").catch(function () {});
}());


/* Table des matières automatique : complète (ou crée) la ligne .chips de chaque dars
   à partir des titres <h2> de ses sections. Les liens déjà écrits sont conservés ;
   seuls les manquants sont ajoutés. Doit s'exécuter AVANT le script de navigation. */
(function () {
  var nav = document.querySelector(".toc");
  if (!nav) return;
  Array.prototype.forEach.call(document.querySelectorAll(".subject"), function (subjectEl) {
    var subj = subjectEl.getAttribute("data-subject");
    var tabsRow = document.querySelector('.tabs[data-subject="' + subj + '"]');
    Array.prototype.forEach.call(subjectEl.querySelectorAll(".lesson"), function (lessonEl) {
      var n = lessonEl.getAttribute("data-lesson");
      var sections = lessonEl.querySelectorAll("section[id]");
      if (!sections.length) return;
      var row = document.querySelector('.chips[data-subject="' + subj + '"][data-for="' + n + '"]');
      if (!row) {
        row = document.createElement("div");
        row.className = "wrap chips";
        row.setAttribute("data-subject", subj);
        row.setAttribute("data-for", n);
        row.hidden = true;
        if (tabsRow && tabsRow.parentNode) tabsRow.parentNode.insertBefore(row, tabsRow.nextSibling);
        else nav.appendChild(row);
      }
      var seen = {};
      Array.prototype.forEach.call(row.querySelectorAll('a[href^="#"]'), function (a) {
        seen[a.getAttribute("href").slice(1)] = true;
      });
      Array.prototype.forEach.call(sections, function (s) {
        if (!s.id || seen[s.id]) return;
        var h = s.querySelector("h2");
        var a = document.createElement("a");
        a.setAttribute("href", "#" + s.id);
        a.textContent = (h && h.textContent.trim()) || s.id;
        row.appendChild(a);
      });
    });
  });
})();


(function () {
  var subjBtns = Array.prototype.slice.call(document.querySelectorAll(".subj"));
  var subjects = Array.prototype.slice.call(document.querySelectorAll(".subject"));
  var tabRows = Array.prototype.slice.call(document.querySelectorAll(".tabs"));
  var chipRows = Array.prototype.slice.call(document.querySelectorAll(".chips"));
  var toc = document.querySelector(".toc");
  var PAGE = (document.body && document.body.getAttribute("data-page")) || "page";
  if (!subjects.length || !subjects.some(function (el) { return el.querySelector(".lesson"); })) return;

  function lessonsOf(sub) { return Array.prototype.slice.call(document.querySelector('.subject[data-subject="' + sub + '"]').querySelectorAll(".lesson")); }

  function show(sub, n, scroll) {
    n = String(n);
    subjBtns.forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-subject") === sub ? "true" : "false"); });
    subjects.forEach(function (el) {
      var on = el.getAttribute("data-subject") === sub;
      el.hidden = !on;
      Array.prototype.slice.call(el.querySelectorAll(".lesson")).forEach(function (l) { l.hidden = !on || l.getAttribute("data-lesson") !== n; });
    });
    tabRows.forEach(function (row) {
      var on = row.getAttribute("data-subject") === sub;
      row.hidden = !on;
      Array.prototype.slice.call(row.querySelectorAll(".tab")).forEach(function (t) {
        var selected = on && t.getAttribute("data-lesson") === n;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.setAttribute("tabindex", selected ? "0" : "-1");
      });
    });
    chipRows.forEach(function (c) { c.hidden = !(c.getAttribute("data-subject") === sub && c.getAttribute("data-for") === n); });
    try {
      ZLEARN_STORAGE.setItem("mourshid-tab-" + PAGE, sub + ":" + n);
      var learningState = JSON.parse(ZLEARN_STORAGE.getItem("mourshid-learning-" + sub) || "{}") || {};
      learningState.lastLesson = n;
      learningState.lastAt = new Date().getTime();
      ZLEARN_STORAGE.setItem("mourshid-learning-" + sub, JSON.stringify(learningState));
    } catch (e) {}
    if (scroll) {
      var top = document.querySelector("main").getBoundingClientRect().top + window.pageYOffset - toc.offsetHeight;
      if (window.pageYOffset > top) window.scrollTo(0, top);
    }
  }

  subjBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var sub = b.getAttribute("data-subject");
      var ls = lessonsOf(sub);
      var last = ls.length ? ls[0].getAttribute("data-lesson") : "1";
      var keep = null;
      try { var saved = ZLEARN_STORAGE.getItem("mourshid-last-" + sub); if (saved) keep = saved; } catch (e) {}
      show(sub, keep || last, true);
    });
  });
  tabRows.forEach(function (row) {
    Array.prototype.slice.call(row.querySelectorAll(".tab")).forEach(function (t) {
      t.addEventListener("click", function () {
        var sub = row.getAttribute("data-subject");
        var n = t.getAttribute("data-lesson");
        try { ZLEARN_STORAGE.setItem("mourshid-last-" + sub, n); } catch (e) {}
        show(sub, n, true);
        var panel = doc.querySelector('.subject[data-subject="' + sub + '"] .lesson[data-lesson="' + n + '"]');
        if (panel && window.history && window.history.pushState && window.location.hash !== "#" + panel.id) {
          try { window.history.pushState({ lesson: panel.id }, "", "#" + panel.id); } catch (e2) {}
        }
      });
    });
  });

  var lastSub = subjects[subjects.length - 1].getAttribute("data-subject");
  var ls0 = lessonsOf(lastSub);
  var sub0 = lastSub, n0 = ls0[0].getAttribute("data-lesson");
  var h = (location.hash || "").replace("#", "");
  var target = h ? document.getElementById(h) : null;
  var holder = target && target.closest ? target.closest(".lesson") : null;
  if (holder) {
    sub0 = holder.parentNode.getAttribute("data-subject");
    n0 = holder.getAttribute("data-lesson");
  } else {
    try {
      var st = ZLEARN_STORAGE.getItem("mourshid-tab-" + PAGE);
      if (st && st.indexOf(":") > 0) { sub0 = st.split(":")[0]; n0 = st.split(":")[1]; }
    } catch (e) {}
    if (!document.querySelector('.subject[data-subject="' + sub0 + '"]')) { sub0 = lastSub; n0 = ls0[0].getAttribute("data-lesson"); }
  }
  show(sub0, n0, false);
  window.addEventListener("popstate", function () {
    var hashTarget = (location.hash || "").slice(1);
    var targetEl = hashTarget ? document.getElementById(hashTarget) : null;
    var targetLesson = targetEl && targetEl.closest ? targetEl.closest(".lesson") : null;
    if (targetLesson) show(targetLesson.parentNode.getAttribute("data-subject"), targetLesson.getAttribute("data-lesson"), false);
    else show(sub0, n0, false);
  });
})();


/* Parcours d’apprentissage : suivi des leçons terminées et reprise du parcours.
   Les checklists de mémorisation restent séparées et ne comptent pas comme leçons terminées. */
(function () {
  var doc = document;
  var mats = (typeof ZLEARN_MATIERES !== "undefined") ? ZLEARN_MATIERES : [];
  function readState(id) {
    try { return JSON.parse(ZLEARN_STORAGE.getItem("mourshid-learning-" + id) || "{}") || {}; }
    catch (e) { return {}; }
  }
  function finishedCount(id) {
    var st = readState(id), n = 0, k;
    for (k in (st.completed || {})) if (st.completed[k]) n++;
    return n;
  }
  function updateProgress() {
    var done = 0, total = 0, i;
    for (i = 0; i < mats.length; i++) {
      var count = finishedCount(mats[i].id);
      done += Math.min(count, mats[i].lessons || 0);
      total += mats[i].lessons || 0;
      var card = doc.querySelector('[data-matiere-card="' + mats[i].id + '"]');
      if (card) {
        var bar = card.querySelector('[data-matiere-learning]');
        var label = card.querySelector(".mlabel");
        var max = mats[i].lessons || 0;
        if (bar) {
          var fill = bar.querySelector(".pfill");
          var now = Math.min(count, max);
          if (fill) fill.style.width = (max ? now / max * 100 : 0) + "%";
          bar.setAttribute("aria-valuemin", "0");
          bar.setAttribute("aria-valuemax", String(max));
          bar.setAttribute("aria-valuenow", String(now));
          bar.setAttribute("aria-valuetext", now + " من " + max + " دروس مكتملة");
        }
        if (label) label.textContent = Math.min(count, max) + " من " + max;
      }
    }
    var labelGlobal = doc.getElementById("gplabel");
    var fillGlobal = doc.querySelector(".gprog .gfill");
    if (labelGlobal) labelGlobal.textContent = "أتممت " + done + " من " + total + " درسًا منشورًا";
    if (fillGlobal) {
      fillGlobal.style.width = (total ? done / total * 100 : 0) + "%";
      var globalBar = fillGlobal.parentNode;
      globalBar.setAttribute("aria-valuemin", "0");
      globalBar.setAttribute("aria-valuemax", String(total));
      globalBar.setAttribute("aria-valuenow", String(done));
      globalBar.setAttribute("aria-valuetext", done + " من " + total + " درسًا منشورًا مكتملًا");
    }

    var resume = doc.getElementById("continue-learning");
    var hint = doc.getElementById("continue-hint");
    if (resume) {
      var best = null, bestIndex = -1;
      for (i = 0; i < mats.length; i++) {
        var st = readState(mats[i].id);
        if (st.lastLesson && (!best || (st.lastAt || 0) > (best.at || 0))) {
          best = { id: mats[i].id, name: mats[i].name, lesson: String(st.lastLesson), at: st.lastAt || 0, completed: st.completed || {} };
          bestIndex = i;
        }
      }
      if (!best) { best = { id: mats[0].id, name: mats[0].name, lesson: "1", completed: {}, fresh: true }; bestIndex = 0; }
      var target = best, nextNumber = null, max = mats[bestIndex].lessons || 0;
      if (best.completed[best.lesson]) {
        for (var step = 1; step <= max; step++) {
          var candidate = String((parseInt(best.lesson, 10) + step - 1) % max + 1);
          if (!best.completed[candidate]) { nextNumber = candidate; break; }
        }
        if (nextNumber) target = { id: best.id, name: best.name, lesson: nextNumber, completed: best.completed };
        else {
          for (var offset = 1; offset < mats.length && !nextNumber; offset++) {
            var otherIndex = (bestIndex + offset) % mats.length, other = mats[otherIndex], otherState = readState(other.id), otherMax = other.lessons || 0;
            for (var j = 1; j <= otherMax; j++) if (!(otherState.completed || {})[String(j)]) {
              target = { id: other.id, name: other.name, lesson: String(j), completed: otherState.completed || {} };
              nextNumber = String(j); break;
            }
          }
        }
      }
      var resumeCard = doc.querySelector('[data-matiere-card="' + target.id + '"]');
      var resumeLink = resumeCard && resumeCard.querySelector('a[data-lesson="' + target.lesson + '"]');
      if (resumeLink) {
        resume.href = resumeLink.href;
        resume.textContent = best.fresh ? "ابدأ الدرس الأول · " + target.name : (target.completed[target.lesson] ? "راجع درسًا · " + target.name + " · الدرس " + target.lesson : "واصل التعلم · " + target.name + " · الدرس " + target.lesson);
        if (hint) hint.textContent = target.completed[target.lesson] ? "أتممت الدروس المنشورة. يمكنك مراجعة آخر درس أو اختيار مادة أخرى." : (best.fresh ? "ابدأ من هنا، وستظهر لك متابعة مناسبة بعد فتح الدروس." : (target.lesson !== best.lesson || target.id !== best.id ? "أكملت آخر درس مفتوح؛ هذا هو الدرس التالي غير المكتمل." : "افتح آخر درس تابعتَه على هذا الجهاز."));
      }
    }
  }
  window.ZLEARN_UPDATE_LEARNING = updateProgress;

  var page = doc.body && doc.body.getAttribute("data-page");
  var subject = doc.querySelector('.subject[data-subject="' + page + '"]');
  if (subject) {
    var lessons = Array.prototype.slice.call(subject.querySelectorAll(".lesson"));
    var state = readState(page);
    state.completed = state.completed || {};
    lessons.forEach(function (lesson, index) {
      var number = lesson.getAttribute("data-lesson");
      var footer = doc.createElement("div");
      footer.className = "lesson-footer";
      var completion = doc.createElement("div");
      completion.className = "lesson-completion";
      var complete = doc.createElement("button");
      complete.type = "button";
      complete.className = "btn lesson-complete";
      complete.setAttribute("aria-pressed", state.completed[number] ? "true" : "false");
      complete.textContent = state.completed[number] ? "أتممت هذا الدرس ✓" : "أتممت هذا الدرس";
      var note = doc.createElement("p");
      note.textContent = "سجّل إتمامه بعد دراسة الشرح ومحاولة التدريبات. يمكنك تغيير حالته في أي وقت.";
      completion.appendChild(complete);
      completion.appendChild(note);
      footer.appendChild(completion);

      var staticStepper = doc.querySelector(".lesson-stepper");
      if (!staticStepper) {
      var stepper = doc.createElement("nav");
      stepper.className = "lesson-stepper";
      stepper.setAttribute("aria-label", "التنقل بين دروس المادة");
      var count = doc.createElement("span");
      count.className = "lesson-step-count";
      var lessonCount = parseInt((doc.body && doc.body.getAttribute("data-lesson-count")) || lessons.length, 10);
      count.textContent = "الدرس " + number + " من " + lessonCount;
      var previousUrl = doc.body && doc.body.getAttribute("data-previous-url");
      if (index > 0) {
        var prev = doc.createElement("button");
        prev.type = "button";
        prev.className = "btn";
        prev.textContent = "الدرس السابق";
        prev.addEventListener("click", function () {
          var tab = doc.querySelector('.tabs[data-subject="' + page + '"] .tab[data-lesson="' + lessons[index - 1].getAttribute("data-lesson") + '"]');
          if (tab) tab.click();
        });
        stepper.appendChild(prev);
      } else if (previousUrl) {
        var prevLink = doc.createElement("a");
        prevLink.className = "btn";
        prevLink.href = previousUrl;
        prevLink.textContent = "الدرس السابق";
        stepper.appendChild(prevLink);
      } else {
        var start = doc.createElement("span");
        start.className = "lesson-step-placeholder";
        stepper.appendChild(start);
      }
      stepper.appendChild(count);
      var nextUrl = doc.body && doc.body.getAttribute("data-next-url");
      if (index < lessons.length - 1) {
        var next = doc.createElement("button");
        next.type = "button";
        next.className = "btn primary";
        next.textContent = "الدرس التالي ←";
        next.addEventListener("click", function () {
          var tab = doc.querySelector('.tabs[data-subject="' + page + '"] .tab[data-lesson="' + lessons[index + 1].getAttribute("data-lesson") + '"]');
          if (tab) tab.click();
        });
        stepper.appendChild(next);
      } else if (nextUrl) {
        var nextLink = doc.createElement("a");
        nextLink.className = "btn primary";
        nextLink.href = nextUrl;
        nextLink.textContent = "الدرس التالي ←";
        stepper.appendChild(nextLink);
      } else {
        var other = doc.createElement("a");
        other.className = "btn primary";
        other.href = page === "home" ? "index.html" : "../index.html";
        other.textContent = "اختر مادة أخرى";
        stepper.appendChild(other);
      }
      footer.appendChild(stepper);
      }
      lesson.appendChild(footer);
      complete.addEventListener("click", function () {
        state = readState(page);
        state.completed = state.completed || {};
        state.completed[number] = !state.completed[number];
        state.lastLesson = number;
        state.lastAt = new Date().getTime();
        complete.setAttribute("aria-pressed", state.completed[number] ? "true" : "false");
        complete.textContent = state.completed[number] ? "أتممت هذا الدرس ✓" : "أتممت هذا الدرس";
        try { ZLEARN_STORAGE.setItem("mourshid-learning-" + page, JSON.stringify(state)); } catch (e) {}
        updateProgress();
      });
    });
  }
  updateProgress();
})();


/* Activités : conserver les réponses de l'apprenant localement et révéler le
   critère seulement quand il le demande. Les réponses restent distinctes du quiz. */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll(".application"), function (activity) {
    if (!activity.id || activity.querySelector("textarea")) return;
    var label = document.createElement("label");
    var answer = document.createElement("textarea");
    var id = activity.id + "-answer", key = "zlearn-answer-" + activity.id;
    label.setAttribute("for", id);
    label.textContent = "اكتب إجابتك قبل عرض معيار الإجابة";
    answer.id = id;
    answer.rows = 4;
    answer.placeholder = "اكتب إجابتك هنا…";
    answer.setAttribute("aria-describedby", id + "-saved");
    try { answer.value = ZLEARN_STORAGE.getItem(key) || ""; } catch (e) {}
    var status = document.createElement("p");
    status.id = id + "-saved";
    status.className = "application-status";
    status.setAttribute("role", "status");
    status.textContent = answer.value ? "إجابتك محفوظة على هذا الجهاز." : "تُحفظ إجابتك على هذا الجهاز فقط.";
    answer.addEventListener("input", function () {
      try { ZLEARN_STORAGE.setItem(key, answer.value); status.textContent = "حُفظت إجابتك على هذا الجهاز."; }
      catch (e) { status.textContent = "تعذر حفظ الإجابة؛ يمكنك متابعة المحاولة دون حفظ."; }
    });
    var clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn application-clear";
    clear.textContent = "مسح إجابتي";
    clear.addEventListener("click", function () {
      answer.value = "";
      try { ZLEARN_STORAGE.removeItem(key); } catch (e) {}
      status.textContent = "مُسحت الإجابة المحفوظة.";
      answer.focus();
    });
    var controls = document.createElement("div");
    controls.className = "application-tools";
    controls.appendChild(status);
    controls.appendChild(clear);
    var model = activity.querySelector("details");
    if (model) {
      activity.insertBefore(label, model);
      activity.insertBefore(answer, model);
      activity.insertBefore(controls, model);
    } else {
      activity.appendChild(label);
      activity.appendChild(answer);
      activity.appendChild(controls);
    }
  });
})();


/* Export/import v2 ; les fichiers v1 sont importés par la couche de stockage. */
(function () {
  var doc = document, buttons = doc.querySelectorAll("[data-progress-export]"), input = doc.getElementById("progress-import"), status = doc.querySelector(".progress-transfer-status");
  if (!buttons.length || !input || !status) return;
  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener("click", function () {
      var payload, link, url;
      try { payload = JSON.stringify(ZLEARN_STORAGE.exportV2()); }
      catch (e) { status.textContent = "تعذر قراءة التقدم المحفوظ."; return; }
      try {
        link = doc.createElement("a");
        if (window.Blob && window.URL && window.URL.createObjectURL) url = window.URL.createObjectURL(new Blob([payload], {type:"application/json"}));
        else url = "data:application/json;charset=utf-8," + encodeURIComponent(payload);
        link.href=url; link.download="zlearn-progress.json"; link.style.display="none"; doc.body.appendChild(link); link.click(); doc.body.removeChild(link);
        status.textContent="نُزّل ملف تقدمك. احتفظ به لاستيراده على جهاز آخر.";
      } catch (e2) { status.textContent="تعذر إنشاء ملف التقدم في هذا المتصفح."; }
    });
  });
  input.addEventListener("change", function () {
    var file=input.files && input.files[0]; if(!file) return;
    var reader=new FileReader();
    reader.onerror=function(){status.textContent="تعذرت قراءة الملف.";};
    reader.onload=function(){
      var payload, ok=false;
      try { payload=JSON.parse(reader.result); } catch(e) { status.textContent="الملف ليس JSON صالحًا."; return; }
      if(!payload || payload.format!=="zlearn-progress") { status.textContent="هذا الملف ليس نسخة تقدم صالحة من Zlearn."; return; }
      if(payload.version===1 && payload.data) ok=ZLEARN_STORAGE.importV1(payload.data);
      else if(payload.version===2) ok=ZLEARN_STORAGE.importV2(payload);
      if(!ok) { status.textContent="هذا الملف ليس نسخة تقدم صالحة من Zlearn."; return; }
      status.textContent="استُورد التقدم. يجري تحديث الصفحة…";
      window.setTimeout(function(){window.location.reload();},350);
    };
    reader.readAsText(file);
  });
})();


/* Interactions : thème clair/sombre, recherche globale, progression globale,
   navigation clavier des onglets, section active, retour en haut.
   ES5, sans dépendance. Toutes les sauvegardes sont protégées par try/catch. */
(function () {
  var doc = document;

  /* --- Normalisation arabe (retrait des harakât + unification des lettres) --- */
  function norm(s) {
    if (!s) return "";
    return s
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
      .replace(/ؤ/g, "و").replace(/ئ/g, "ي")
      .replace(/[\s\u00A0]+/g, " ").toLowerCase().trim();
  }

  /* --- Afficher une leçon en réutilisant les boutons du site --- */
  function goTo(sub, lesson, id) {
    if (sub !== PAGE) {
      var mat = MATS.filter(function (item) { return item.id === sub; })[0];
      if (mat) window.location.href = mat.file + (id ? "#" + id : "#lesson-" + lesson);
      return;
    }
    var sb = doc.querySelector('.subj[data-subject="' + sub + '"]');
    if (sb) sb.click();
    var tab = doc.querySelector('.tabs[data-subject="' + sub + '"] .tab[data-lesson="' + lesson + '"]');
    if (tab) tab.click();
    if (id) {
      var el = doc.getElementById(id);
      if (el) {
        if (typeof el.scrollIntoView === "function") {
          try { el.scrollIntoView({ block: "start" }); } catch (e) { el.scrollIntoView(); }
        } else if (typeof window.scrollTo === "function") {
          window.scrollTo(0, el.offsetTop);
        }
        el.setAttribute("tabindex", "-1");
        if (typeof el.focus === "function") el.focus();
        try { history.replaceState(null, "", "#" + id); } catch (e2) {}
      }
    }
  }

  /* --- Thème clair / sombre --- */
  var rootEl = doc.documentElement;
  var themeBtn = doc.getElementById("theme-toggle");
  function currentTheme() {
    var attr = rootEl.getAttribute("data-theme");
    if (attr) return attr;
    try { return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"; }
    catch (e) { return "light"; }
  }
  function paintThemeBtn() {
    if (!themeBtn) return;
    var dark = currentTheme() === "dark";
    themeBtn.textContent = dark ? "☀️" : "🌙";
    themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
    themeBtn.setAttribute("aria-label", dark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي");
  }
  try {
    var savedTheme = ZLEARN_STORAGE.getItem("mourshid-theme");
    if (savedTheme === "dark" || savedTheme === "light") rootEl.setAttribute("data-theme", savedTheme);
  } catch (e) {}
  paintThemeBtn();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      rootEl.setAttribute("data-theme", next);
      try { ZLEARN_STORAGE.setItem("mourshid-theme", next); } catch (e) {}
      paintThemeBtn();
    });
  }
  if (window.matchMedia) {
    try {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onSys = function () { if (!rootEl.getAttribute("data-theme")) paintThemeBtn(); };
      if (mq.addEventListener) mq.addEventListener("change", onSys);
      else if (mq.addListener) mq.addListener(onSys);
    } catch (e) {}
  }

  /* --- Progression globale : agrégée entre les pages matière --- */
  var gfill = doc.querySelector(".gprog .gfill");
  var glabel = doc.getElementById("gplabel");
  var PAGE = (doc.body && doc.body.getAttribute("data-page")) || "";
  var MATS = (typeof ZLEARN_MATIERES !== "undefined") ? ZLEARN_MATIERES : [];
  function readAgg(id) {
    try { return JSON.parse(ZLEARN_STORAGE.getItem("mourshid-prog-" + id) || "null"); }
    catch (e) { return null; }
  }
  function storeAgg() {
    var found = false, i;
    for (i = 0; i < MATS.length; i++) { if (MATS[i].id === PAGE) found = true; }
    if (!found) return;
    var boxes = doc.querySelectorAll(".check input[type=checkbox]");
    var total = boxes.length, done = 0, j;
    if (!total) return;
    for (j = 0; j < total; j++) { if (boxes[j].checked) done++; }
    try { ZLEARN_STORAGE.setItem("mourshid-prog-" + PAGE, JSON.stringify({ done: done, total: total })); } catch (e) {}
  }
  function updateGlobal() {
    if (window.ZLEARN_UPDATE_LEARNING) window.ZLEARN_UPDATE_LEARNING();
  }
  Array.prototype.forEach.call(doc.querySelectorAll(".check input[type=checkbox]"), function (b) {
    b.addEventListener("change", function () { storeAgg(); updateGlobal(); });
  });
  if (PAGE) { storeAgg(); }
  Array.prototype.forEach.call(doc.querySelectorAll(".plabel"), function (l) {
    l.setAttribute("aria-live", "polite");
  });
  updateGlobal();

  /* --- Recherche --- */
  var input = doc.getElementById("q");
  var sr = doc.getElementById("sr");
  var index = [];
  var SUBJ_NAMES = { fiqh: "الفقه", aqida: "العقيدة", tajwid: "التجويد", sira: "السيرة النبوية", hadith: "الحديث", akhlaq: "الأخلاق", nahw: "النحو" };
  Array.prototype.forEach.call(doc.querySelectorAll(".subject"), function (subjectEl) {
    var sub = subjectEl.getAttribute("data-subject");
    var subjName = SUBJ_NAMES[sub] || sub;
    Array.prototype.forEach.call(subjectEl.querySelectorAll(".lesson"), function (lessonEl) {
      var n = lessonEl.getAttribute("data-lesson");
      var head = lessonEl.querySelector(".part-head h2");
      var titleRaw = head ? head.textContent.trim() : ("الدرس " + n);
      var titleNorm = norm(titleRaw);
      Array.prototype.forEach.call(lessonEl.querySelectorAll("section[id]"), function (s) {
        var h = s.querySelector("h2");
        if (!h) return;
        index.push({
          sub: sub, lesson: n, id: s.id,
          url: (doc.body && doc.body.getAttribute("data-lesson-url")) || "",
          subjName: subjName,
          sec: h.textContent.trim(), title: titleRaw,
          hay: norm(h.textContent) + " " + titleNorm + " " + norm(subjName) + " " + norm(s.textContent)
        });
      });
    });
  });

  function hideResults() {
    if (sr) { sr.hidden = true; sr.textContent = ""; }
    if (input) input.setAttribute("aria-expanded", "false");
  }
  function render(q) {
    if (!sr || !input) return;
    sr.textContent = "";
    if (q.length < 2) { hideResults(); return; }
    var terms = q.split(" ").filter(function (t) { return t.length > 1; });
    if (!terms.length) terms = [q];
    var hits = [], i, j;
    for (i = 0; i < index.length; i++) {
      var it = index[i], ok = true;
      for (j = 0; j < terms.length; j++) { if (it.hay.indexOf(terms[j]) < 0) { ok = false; break; } }
      if (ok) {
        var strong = terms.some(function (t) { return norm(it.sec).indexOf(t) >= 0; });
        var inTitle = terms.some(function (t) { return norm(it.title).indexOf(t) >= 0; });
        hits.push({ it: it, score: (strong ? 2 : 0) + (inTitle ? 1 : 0) });
      }
    }
    var crossIndex = (typeof ZLEARN_SEARCH_SECTIONS !== "undefined") ? ZLEARN_SEARCH_SECTIONS : [];
    for (i = 0; i < crossIndex.length; i++) {
      var cross = crossIndex[i];
      var currentLessonUrl = doc.body && doc.body.getAttribute("data-lesson-url");
      if (cross.sub === PAGE && currentLessonUrl && cross.url === currentLessonUrl) continue;
      var crossName = SUBJ_NAMES[cross.sub] || cross.sub;
      var crossHay = norm(cross.section + " " + cross.title + " " + crossName), crossOk = true;
      for (j = 0; j < terms.length; j++) if (crossHay.indexOf(terms[j]) < 0) { crossOk = false; break; }
      if (crossOk) {
        var crossStrong = terms.some(function (t) { return norm(cross.section).indexOf(t) >= 0; });
        var crossTitle = terms.some(function (t) { return norm(cross.title).indexOf(t) >= 0; });
        hits.push({ it: { sub: cross.sub, lesson: cross.lesson, id: cross.id, file: cross.file, url: cross.url || cross.file, subjName: crossName, sec: cross.section, title: cross.title }, score: (crossStrong ? 2 : 0) + (crossTitle ? 1 : 0) });
      }
    }
    hits.sort(function (a, b) { return b.score - a.score; });
    if (!hits.length) {
      var e = doc.createElement("div");
      e.className = "empty";
      e.textContent = "لا توجد نتائج.";
      sr.appendChild(e);
      sr.hidden = false;
      input.setAttribute("aria-expanded", "true");
      return;
    }
    hits.slice(0, 20).forEach(function (h) {
      var it = h.it;
      var a = doc.createElement("a");
      var currentLessonUrl = doc.body && doc.body.getAttribute("data-lesson-url");
      var localResult = it.sub === PAGE && currentLessonUrl && it.url === currentLessonUrl;
      var sitePrefix = doc.body && doc.body.getAttribute("data-site-prefix");
      a.setAttribute("href", localResult ? "#" + it.id : (sitePrefix || "") + (it.url || it.file) + "#" + it.id);
      a.textContent = it.sec;
      var c = doc.createElement("span");
      c.className = "ctx";
      c.textContent = it.subjName + " · " + it.title + " — " + it.sec;
      a.appendChild(c);
      if (localResult) a.addEventListener("click", function (ev) {
        ev.preventDefault();
        goTo(it.sub, it.lesson, it.id);
        if (input) input.value = "";
        hideResults();
      });
      sr.appendChild(a);
    });
    sr.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  if (input && sr) {
    var tmr = null;
    input.addEventListener("input", function () {
      var q = norm(input.value);
      if (tmr) clearTimeout(tmr);
      tmr = setTimeout(function () { render(q); }, 120);
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { input.value = ""; hideResults(); }
      else if (ev.key === "ArrowDown" && !sr.hidden) {
        var first = sr.querySelector("a");
        if (first) { ev.preventDefault(); first.focus(); }
      } else if (ev.key === "Enter" && !sr.hidden) {
        var fa = sr.querySelector("a");
        if (fa) { ev.preventDefault(); fa.click(); }
      }
    });
    doc.addEventListener("click", function (ev) {
      if (!sr.hidden && !sr.contains(ev.target) && ev.target !== input) hideResults();
    });
    sr.addEventListener("keydown", function (ev) {
      var links = Array.prototype.slice.call(sr.querySelectorAll("a"));
      var current = links.indexOf(doc.activeElement);
      if (ev.key === "Escape") { ev.preventDefault(); hideResults(); input.focus(); }
      else if ((ev.key === "ArrowDown" || ev.key === "ArrowUp") && links.length) {
        ev.preventDefault();
        var next = ev.key === "ArrowDown" ? Math.min(links.length - 1, current + 1) : Math.max(0, current - 1);
        if (current <= 0 && ev.key === "ArrowUp") input.focus();
        else links[next].focus();
      }
    });
  }

  /* --- Onglets : flèches clavier (RTL) --- */
  function wireTablist(container, selector) {
    if (!container) return;
    container.addEventListener("keydown", function (ev) {
      var keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (keys.indexOf(ev.key) < 0) return;
      var items = Array.prototype.slice.call(container.querySelectorAll(selector));
      if (!items.length) return;
      var i = items.indexOf(doc.activeElement);
      if (i < 0) i = 0;
      ev.preventDefault();
      var j = i;
      if (ev.key === "ArrowLeft") j = i + 1;
      else if (ev.key === "ArrowRight") j = i - 1;
      else if (ev.key === "Home") j = 0;
      else if (ev.key === "End") j = items.length - 1;
      j = (j + items.length) % items.length;
      items[j].focus();
      items[j].click();
    });
  }
  wireTablist(doc.querySelector(".subjects"), ".subj");
  Array.prototype.forEach.call(doc.querySelectorAll(".tabs"), function (t) { wireTablist(t, ".tab"); });

  /* --- Retour en haut + mise en évidence du chapitre actif --- */
  var toTop = doc.getElementById("toTop");
  var toc = doc.querySelector(".toc");
  var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 100); };
  var ticking = false;

  function updateActiveChip() {
    var activeLesson = doc.querySelector('.lesson:not([hidden])');
    var activeRow = doc.querySelector('.chips:not([hidden])');
    if (!activeLesson || !activeRow) return;
    var sections = activeLesson.querySelectorAll("section[id]");
    var offset = (toc ? toc.offsetHeight : 0) + 24;
    var current = null, i;
    for (i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top - offset <= 0) current = sections[i].id;
    }
    Array.prototype.forEach.call(activeRow.querySelectorAll("a"), function (a) {
      if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  function onScroll() {
    if (toTop) {
      if (window.pageYOffset > 600) toTop.classList.add("on");
      else toTop.classList.remove("on");
    }
    if (!ticking) {
      ticking = true;
      raf(function () { updateActiveChip(); ticking = false; });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  if (toTop) {
    toTop.addEventListener("click", function () {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
    });
  }
  onScroll();
  setTimeout(updateActiveChip, 300);
})();


/* Quiz : auto-évaluation (عرفتها / أحتاج مراجعة), score, filtre « à revoir »,
   rappel de révision espacée. Les résultats sont sauvegardés dans le navigateur
   sous « mourshid-quiz-<id du quiz> ». ES5, sans dépendance. */
(function () {
  var doc = document;
  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function fmt(ts) { var d = new Date(ts); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1); }
  Array.prototype.forEach.call(doc.querySelectorAll('section[id$="quiz"]'), function (quiz) {
    var items = Array.prototype.filter.call(quiz.children, function (child) {
      return child.tagName && child.tagName.toLowerCase() === "details";
    });
    if (!items.length) return;
    var key = "mourshid-quiz-" + quiz.id;
    var st = { g: {}, at: 0 };
    try { var raw = JSON.parse(ZLEARN_STORAGE.getItem(key) || "null"); if (raw && raw.g) st = raw; } catch (e) {}
    function save() { try { ZLEARN_STORAGE.setItem(key, JSON.stringify(st)); } catch (e) {} }

    var bar = doc.createElement("div");
    bar.className = "quiz-tools";
    var score = doc.createElement("p");
    score.className = "quiz-score";
    score.setAttribute("role", "status");
    score.setAttribute("aria-live", "polite");
    var advice = doc.createElement("p");
    advice.className = "quiz-advice";
    var filterBtn = doc.createElement("button");
    filterBtn.type = "button";
    filterBtn.className = "btn";
    filterBtn.textContent = "إظهار التدريبات التي أحتاجها";
    var resetBtn = doc.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "btn";
    resetBtn.textContent = "أعد التدريب";
    bar.appendChild(score);
    bar.appendChild(filterBtn);
    bar.appendChild(resetBtn);
    bar.appendChild(advice);
    items[0].parentNode.insertBefore(bar, items[0]);

    function refresh() {
      var ok = 0, rev = 0, i;
      for (i = 0; i < items.length; i++) {
        var g = st.g[i] || "";
        items[i].setAttribute("data-grade", g);
        if (g === "ok") ok++; else if (g === "review") rev++;
        var bs = items[i].querySelectorAll(".self-grade button");
        bs[0].setAttribute("aria-pressed", g === "ok" ? "true" : "false");
        bs[1].setAttribute("aria-pressed", g === "review" ? "true" : "false");
      }
      var done = ok + rev;
      score.textContent = done
        ? "التقييم الذاتي: " + ok + " من " + items.length + " · أحتاج مراجعة: " + rev + (st.at ? " · آخر تدريب: " + fmt(st.at) : "")
        : "بعد محاولة الإجابة ومقارنة النموذج، قيّم فهمك: «عرفتها» أو «أحتاج مراجعة».";
      filterBtn.disabled = rev === 0 && !quiz.classList.contains("only-review");
      if (done === items.length) {
        advice.textContent = rev
          ? "ارجع إلى أقسام الدرس المرتبطة بالتدريبات الموسومة، ثم أعد التدريب لاحقًا."
          : "أحسنت! أعد التدريب بعد 3 أيام، ثم بعد أسبوع لتثبيت ما تعلمته.";
      } else {
        advice.textContent = "";
      }
    }

    items.forEach(function (d, i) {
      var box = doc.createElement("div");
      box.className = "self-grade";
      var yes = doc.createElement("button");
      yes.type = "button";
      yes.className = "btn grade-ok";
      yes.textContent = "عرفتها ✓";
      var no = doc.createElement("button");
      no.type = "button";
      no.className = "btn grade-review";
      no.textContent = "أحتاج مراجعة";
      function grade(v) {
        st.g[i] = v;
        st.at = new Date().getTime();
        save();
        refresh();
      }
      yes.addEventListener("click", function () { grade("ok"); });
      no.addEventListener("click", function () { grade("review"); });
      box.appendChild(yes);
      box.appendChild(no);
      d.appendChild(box);
    });

    filterBtn.addEventListener("click", function () {
      var on = quiz.classList.toggle("only-review");
      filterBtn.textContent = on ? "إظهار كل الأسئلة" : "إظهار التدريبات التي أحتاجها";
      items.forEach(function (d) { if (on && d.getAttribute("data-grade") === "review") d.open = true; });
      refresh();
    });
    resetBtn.addEventListener("click", function () {
      st = { g: {}, at: 0 };
      save();
      quiz.classList.remove("only-review");
      filterBtn.textContent = "إظهار التدريبات التي أحتاجها";
      items.forEach(function (d) { d.open = false; });
      refresh();
    });
    refresh();
  });
})();


/* Cartes mentales : version simplifiée en cartes sur petit écran (≤ 700 px),
   générée depuis le SVG ; un bouton permet d'afficher la carte complète. */
(function () {
  var doc = document;
  Array.prototype.forEach.call(doc.querySelectorAll(".scroll"), function (box) {
    var svg = box.querySelector("svg");
    if (!svg) return;
    var nodes = svg.querySelectorAll("g.node");
    if (!nodes.length) return;
    var heads = [];
    Array.prototype.forEach.call(svg.querySelectorAll("text.on-hero"), function (t) {
      var s = t.textContent.replace(/\s+/g, " ").trim();
      if (s && heads.indexOf(s) < 0) heads.push(s);
    });
    var wrap = doc.createElement("div");
    wrap.className = "map-list";
    var h = doc.createElement("h3");
    h.textContent = heads.join(" ") || svg.getAttribute("aria-label") || "";
    wrap.appendChild(h);
    var ul = doc.createElement("ul");
    Array.prototype.forEach.call(nodes, function (n) {
      var li = doc.createElement("li");
      var extra = (n.getAttribute("class") || "").replace("node", "").replace(/\s+/g, " ").trim();
      li.className = extra;
      Array.prototype.forEach.call(n.querySelectorAll("text"), function (t) {
        var txt = t.textContent.replace(/\s+/g, " ").trim();
        if (!txt) return;
        var cls = t.getAttribute("class") || "";
        var el = doc.createElement(cls.indexOf("t-title") >= 0 ? "strong" : "p");
        el.textContent = txt;
        li.appendChild(el);
      });
      if (li.firstChild) ul.appendChild(li);
    });
    if (!ul.firstChild) return;
    wrap.appendChild(ul);
    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "btn map-toggle";
    btn.textContent = "عرض الخريطة الكاملة";
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      var on = !box.classList.contains("force");
      if (on) { box.classList.add("force"); wrap.classList.add("force"); }
      else { box.classList.remove("force"); wrap.classList.remove("force"); }
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "العودة إلى العرض المبسّط" : "عرض الخريطة الكاملة";
    });
    wrap.appendChild(btn);
    box.classList.add("has-list");
    box.parentNode.insertBefore(wrap, box.nextSibling);
  });
})();

/* Fonctions pures du calendrier de révision. Dates locales YYYY-MM-DD. */
(function(root, factory) {
  var api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  root.ZLEARN_SRS=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  var intervals=[1,3,7,14,30];
  function shift(day,n){var d=new Date(day+"T12:00:00"); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function grade(card,correct,confidence,day){
    var old=card||{}, box=old.box||1, next;
    if(!correct||confidence==="guessed") next=1;
    else if(confidence==="sure") next=Math.min(5,box+1);
    else next=box;
    var days=(!correct||confidence==="guessed")?1:intervals[next-1];
    var history=Array.isArray(old.history)?old.history.slice():[]; history.push(correct?1:0);
    return {box:next,due:shift(day,days),history:history};
  }
  function dueCards(catalog,state,day,max){
    var eligible=[]; (catalog||[]).forEach(function(item){var c=state.cards[item.question.id]; if(c&&c.due<=day) eligible.push({item:item,due:c.due,subject:item.subject});});
    eligible.sort(function(a,b){return a.due<b.due?-1:a.due>b.due?1:0;});
    var groups={}, order=[], result=[];
    eligible.forEach(function(x){if(!groups[x.subject]){groups[x.subject]=[];order.push(x.subject);}groups[x.subject].push(x);});
    while(order.length&&result.length<(max||20)){var next=[];order.forEach(function(s){if(groups[s].length){result.push(groups[s].shift());if(groups[s].length)next.push(s);}});order=next;}
    return result.map(function(x){return x.item;});
  }
  function soonestDue(cards){
    var best="";
    Object.keys(cards||{}).forEach(function(id){var c=cards[id]; if(c&&c.due&&(!best||c.due<best))best=c.due;});
    return best;
  }
  return {intervals:intervals.slice(),shiftDate:shift,grade:grade,dueCards:dueCards,soonestDue:soonestDue};
}));

/* Interface de rappel actif : réponse, confiance, correction expliquée, auto-évaluation. */
(function(root){
  "use strict";
  function el(tag,cls,text){var n=document.createElement(tag); if(cls)n.className=cls; if(text)n.textContent=text; return n;}
  function save(q,correct,confidence){var st=root.ZLEARN_STORAGE.getState(); st.cards[q.id]=root.ZLEARN_SRS.grade(st.cards[q.id],correct,confidence,root.ZLEARN_SRS.shiftDate((function(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}()),0)); root.ZLEARN_STORAGE.setState(st);}
  /* Donne le focus à la carte : premier contrôle interactif, sinon le conteneur (tabindex=-1). */
  function place(node){
    if(!node||!node.focus)return false;
    if(node.disabled)return false;
    if(!node.getAttribute("tabindex")&&!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(node.tagName||""))node.setAttribute("tabindex","-1");
    try{node.focus();}catch(e){}
    return true;
  }
  function focusStage(stage){
    place(stage.querySelector("button, a[href], input, select, textarea, [tabindex]")||stage);
  }
  /* Après la fin d'une carte : carte suivante dans l'ordre du document, sinon message de fin. */
  function focusNext(card,stage){
    var cards=document.querySelectorAll(".study-card");
    for(var i=0;i<cards.length;i++){
      if(cards[i]===card){
        var next=cards[i+1];
        if(next){ place(next.querySelector("textarea")||next)||place(next); } else { place(stage); }
        return;
      }
    }
    place(stage);
  }
  function renderOne(host,q,onDone){
    var card=el("article","study-card"); card.appendChild(el("h3","",q.prompt));
    var answer=el("textarea","study-answer"); answer.rows=3; answer.setAttribute("aria-label","اكتب إجابتك قبل عرض الإجابة النموذجية"); answer.placeholder="اكتب إجابتك من الذاكرة…"; card.appendChild(answer);
    var stage=el("div","study-stage"); stage.setAttribute("aria-live","polite"); card.appendChild(stage);
    var attempt=el("button","btn primary","سجّلت محاولتي"); attempt.type="button"; attempt.disabled=true; card.appendChild(attempt);
    answer.addEventListener("input",function(){attempt.disabled=!answer.value.trim();});
    attempt.addEventListener("click",function(){ if(!answer.value.trim())return; answer.disabled=true; attempt.disabled=true; attempt.hidden=true;
      stage.innerHTML=""; stage.appendChild(el("p","study-label","ما مستوى ثقتك قبل رؤية الإجابة؟"));
      [ ["sure","واثق"],["hesitant","متردد"],["guessed","خمّنت"] ].forEach(function(pair){var b=el("button","btn",pair[1]); b.type="button"; b.addEventListener("click",function(){
        stage.innerHTML=""; stage.appendChild(el("p","study-label","الإجابة النموذجية")); stage.appendChild(el("p","study-model",q.answer)); stage.appendChild(el("p","study-explain",q.explain)); var revisit=el("a","study-revisit","راجع موضع الشرح في الدرس"); revisit.href=q.sectionUrl||("#"+q.section); stage.appendChild(revisit); stage.appendChild(el("p","study-label","هل كانت إجابتك صحيحة؟"));
        [[true,"نعم، إجابتي صحيحة"],[false,"أحتاج إلى مراجعة"]].forEach(function(choice){var rate=el("button","btn",choice[1]); rate.type="button"; rate.addEventListener("click",function(){save(q,choice[0],pair[0]); stage.innerHTML=""; stage.appendChild(el("p","study-result",choice[0]?"سُجلت للمراجعة اللاحقة." : "ستعود هذه البطاقة غدًا.")); if(onDone)onDone(choice[0],pair[0]); focusNext(card,stage);}); stage.appendChild(rate);});
        focusStage(stage);
      });stage.appendChild(b);});
      focusStage(stage);
    });
    host.appendChild(card); return card;
  }
  function hostFor(item,pre,practice){
    if(item.phase==="pretest")return pre||practice;
    if(item.checkpoint){var mount=document.querySelector('[data-checkpoint="'+item.checkpoint+'"]'); if(mount)return mount;}
    return practice;
  }
  function initLesson(){
    var data=document.getElementById("lesson-question-data");if(!data)return;var questions;try{questions=JSON.parse(data.textContent);}catch(e){return;}
    var pre=document.querySelector("[data-pretest]");var practice=document.querySelector("[data-practice]");var confirm=document.querySelector("[data-review-confirm]");
    var sessionPending=0,started=false;
    function announce(){
      if(!confirm)return;
      var date="";try{if(root.ZLEARN_SRS&&root.ZLEARN_SRS.soonestDue){date=root.ZLEARN_SRS.soonestDue(root.ZLEARN_STORAGE.getState().cards);}}catch(e){}
      confirm.textContent="أُضيفت للمراجعة"+(date?" · أقرب مراجعة: "+date:"");confirm.hidden=false;
    }
    function renderItem(host,item,state){
      renderOne(host,item,function(correct,confidence){
        sessionPending--;state.pending--;
        if(!correct&&confidence==="sure"&&!item._retried){var retry={};Object.keys(item).forEach(function(k){retry[k]=item[k];});retry._retried=true;state.retries.push(retry);sessionPending++;}
        if(state.pending===0&&state.retries.length){state.pending=1;renderItem(host,state.retries.shift(),state);return;}
        if(sessionPending<=0&&started)announce();
      });
    }
    function mount(host,items){
      if(!host||!items.length)return;
      var state={pending:items.length,retries:[]};
      started=true;
      items.forEach(function(item){sessionPending++;renderItem(host,item,state);});
    }
    var groups=[];
    function groupFor(host){for(var i=0;i<groups.length;i++){if(groups[i][0]===host)return groups[i];}groups.push([host,[]]);return groups[groups.length-1];}
    questions.forEach(function(item){var host=hostFor(item,pre,practice);if(host)groupFor(host)[1].push(item);});
    groups.forEach(function(group){mount(group[0],group[1]);});
  }
  root.ZLEARN_QUIZ={renderOne:renderOne,initLesson:initLesson};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initLesson);else initLesson();
}(window));

(function(root){
  "use strict";
  function today(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
  function init(){
    var st=root.ZLEARN_STORAGE.getState(), catalog=root.ZLEARN_QUESTION_CATALOG||[], due=root.ZLEARN_SRS.dueCards(catalog,st,today(),20), count=document.querySelector("[data-review-count]"), list=document.querySelector("[data-review-list]");
    if(count){var dueCount=due.length;if(!list){dueCount=0;Object.keys(st.cards).forEach(function(id){if(st.cards[id].due<=today())dueCount++;});dueCount=Math.min(20,dueCount);}count.textContent=String(dueCount);}
    if(!list)return;
    if(!due.length){var empty=document.createElement("p");empty.className="review-empty";empty.textContent="لا توجد بطاقات مستحقة اليوم. واصل دراسة درس جديد.";list.appendChild(empty);return;}
    var retries=[];function add(item){var section=document.createElement("section");section.className="review-item";var link=document.createElement("a");link.href="../"+item.url+"#"+item.question.section;link.textContent=item.subjectName+" · "+item.lessonTitle;section.appendChild(link);var question={};Object.keys(item.question).forEach(function(k){question[k]=item.question[k];});question.sectionUrl=link.href;root.ZLEARN_QUIZ.renderOne(section,question,function(correct,confidence){if(!correct&&confidence==="sure"&&!item._retried){var retry={};Object.keys(item).forEach(function(k){retry[k]=item[k];});retry._retried=true;retries.push(retry);}if(!retries.length)return;var next=retries.shift();window.setTimeout(function(){add(next);},0);});list.appendChild(section);}
    due.forEach(add);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}(window));
