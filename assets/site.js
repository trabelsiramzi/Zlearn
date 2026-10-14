/* Zlearn — script partagé par toutes les pages (ES5, sans dépendance).
   Le manifeste suit séparément les cases de mémorisation (total) et les dars publiés
   (lessons) ; le parcours d’apprentissage ne compte que les leçons terminées. */
var ZLEARN_MATIERES = [
  { id: "fiqh", name: "مادة الفقه", book: "المرشد المعين على الضروري من علوم الدين", file: "fiqh/index.html", total: 35, lessons: 3 },
  { id: "aqida", name: "مادة العقيدة", book: "الشذرات الذهبية", file: "aqida/index.html", total: 41, lessons: 3 },
  { id: "tajwid", name: "مادة التجويد", book: "علم التجويد", file: "tajwid/index.html", total: 36, lessons: 3 },
  { id: "sira", name: "مادة السيرة النبوية", book: "السيرة النبوية", file: "sira/index.html", total: 36, lessons: 3 },
  { id: "hadith", name: "مادة الحديث", book: "شرح الأربعين النووية", file: "hadith/index.html", total: 36, lessons: 3 },
  { id: "akhlaq", name: "مادة الأخلاق", book: "تذكرة السامع والمتكلم في أدب العالم والمتعلم", file: "akhlaq/index.html", total: 23, lessons: 3 },
  { id: "nahw", name: "مادة النحو", book: "الدروس النحوية", file: "nahw/index.html", total: 27, lessons: 3 }
];

(function () {
  document.querySelectorAll(".group").forEach(function (g) {
    var gkey = "mourshid-" + g.getAttribute("data-key");
    var gstate = {};
    try { gstate = JSON.parse(localStorage.getItem(gkey) || "{}") || {}; } catch (e) { gstate = {}; }
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
        try { localStorage.setItem(gkey, JSON.stringify(gstate)); } catch (e) {}
        update();
      });
    });
    update();
  });

  document.querySelectorAll("textarea[data-key]").forEach(function (ta) {
    var tkey = "mourshid-" + ta.getAttribute("data-key") + "-verses";
    try { var v = localStorage.getItem(tkey); if (v) ta.value = v; } catch (e) {}
    ta.addEventListener("input", function () { try { localStorage.setItem(tkey, ta.value); } catch (e) {} });
  });

  document.querySelectorAll(".toggle-all").forEach(function (btn) {
    var open = false;
    btn.addEventListener("click", function () {
      open = !open;
      document.getElementById(btn.getAttribute("data-target")).querySelectorAll("details").forEach(function (d) { d.open = open; });
      btn.textContent = open ? "إخفاء كل الأجوبة" : "إظهار كل الأجوبة";
    });
  });
})();

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
  if (!subjects.length) return;

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
      Array.prototype.slice.call(row.querySelectorAll(".tab")).forEach(function (t) { t.setAttribute("aria-selected", on && t.getAttribute("data-lesson") === n ? "true" : "false"); });
    });
    chipRows.forEach(function (c) { c.hidden = !(c.getAttribute("data-subject") === sub && c.getAttribute("data-for") === n); });
    try {
      localStorage.setItem("mourshid-tab-" + PAGE, sub + ":" + n);
      var learningState = JSON.parse(localStorage.getItem("mourshid-learning-" + sub) || "{}") || {};
      learningState.lastLesson = n;
      learningState.lastAt = new Date().getTime();
      localStorage.setItem("mourshid-learning-" + sub, JSON.stringify(learningState));
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
      try { var saved = localStorage.getItem("mourshid-last-" + sub); if (saved) keep = saved; } catch (e) {}
      show(sub, keep || last, true);
    });
  });
  tabRows.forEach(function (row) {
    Array.prototype.slice.call(row.querySelectorAll(".tab")).forEach(function (t) {
      t.addEventListener("click", function () {
        var sub = row.getAttribute("data-subject");
        var n = t.getAttribute("data-lesson");
        try { localStorage.setItem("mourshid-last-" + sub, n); } catch (e) {}
        show(sub, n, true);
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
      var st = localStorage.getItem("mourshid-tab-" + PAGE);
      if (st && st.indexOf(":") > 0) { sub0 = st.split(":")[0]; n0 = st.split(":")[1]; }
    } catch (e) {}
    if (!document.querySelector('.subject[data-subject="' + sub0 + '"]')) { sub0 = lastSub; n0 = ls0[0].getAttribute("data-lesson"); }
  }
  show(sub0, n0, false);
})();

/* Parcours d’apprentissage : suivi des leçons terminées et reprise du parcours.
   Les checklists de mémorisation restent séparées et ne comptent pas comme leçons terminées. */
(function () {
  var doc = document;
  var mats = (typeof ZLEARN_MATIERES !== "undefined") ? ZLEARN_MATIERES : [];
  function readState(id) {
    try { return JSON.parse(localStorage.getItem("mourshid-learning-" + id) || "{}") || {}; }
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
    if (fillGlobal) fillGlobal.style.width = (total ? done / total * 100 : 0) + "%";

    var resume = doc.getElementById("continue-learning");
    var hint = doc.getElementById("continue-hint");
    if (resume) {
      var best = null;
      for (i = 0; i < mats.length; i++) {
        var st = readState(mats[i].id);
        if (st.lastLesson && (!best || (st.lastAt || 0) > (best.at || 0))) {
          best = { id: mats[i].id, name: mats[i].name, lesson: String(st.lastLesson), at: st.lastAt || 0 };
        }
      }
      if (best) {
        var resumeCard = doc.querySelector('[data-matiere-card="' + best.id + '"]');
        var resumeLink = resumeCard && resumeCard.querySelector('a[data-lesson="' + best.lesson + '"]');
        if (resumeLink) {
          resume.href = resumeLink.href;
          resume.textContent = "واصل التعلم · " + best.name + " · الدرس " + best.lesson;
          if (hint) hint.textContent = "افتح آخر درس تابعتَه على هذا الجهاز.";
        }
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

      var stepper = doc.createElement("nav");
      stepper.className = "lesson-stepper";
      stepper.setAttribute("aria-label", "التنقل بين دروس المادة");
      var count = doc.createElement("span");
      count.className = "lesson-step-count";
      count.textContent = "الدرس " + number + " من " + lessons.length;
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
      } else {
        var start = doc.createElement("span");
        start.className = "lesson-step-placeholder";
        stepper.appendChild(start);
      }
      stepper.appendChild(count);
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
      } else {
        var other = doc.createElement("a");
        other.className = "btn primary";
        other.href = page === "home" ? "index.html" : "../index.html";
        other.textContent = "اختر مادة أخرى";
        stepper.appendChild(other);
      }
      footer.appendChild(stepper);
      lesson.appendChild(footer);
      complete.addEventListener("click", function () {
        state = readState(page);
        state.completed = state.completed || {};
        state.completed[number] = !state.completed[number];
        state.lastLesson = number;
        state.lastAt = new Date().getTime();
        complete.setAttribute("aria-pressed", state.completed[number] ? "true" : "false");
        complete.textContent = state.completed[number] ? "أتممت هذا الدرس ✓" : "أتممت هذا الدرس";
        try { localStorage.setItem("mourshid-learning-" + page, JSON.stringify(state)); } catch (e) {}
        updateProgress();
      });
    });
  }
  updateProgress();
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
    var savedTheme = localStorage.getItem("mourshid-theme");
    if (savedTheme === "dark" || savedTheme === "light") rootEl.setAttribute("data-theme", savedTheme);
  } catch (e) {}
  paintThemeBtn();
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      rootEl.setAttribute("data-theme", next);
      try { localStorage.setItem("mourshid-theme", next); } catch (e) {}
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
    try { return JSON.parse(localStorage.getItem("mourshid-prog-" + id) || "null"); }
    catch (e) { return null; }
  }
  function storeAgg() {
    var found = false, i;
    for (i = 0; i < MATS.length; i++) { if (MATS[i].id === PAGE) found = true; }
    if (!found) return;
    var boxes = doc.querySelectorAll(".check input[type=checkbox]");
    var total = boxes.length, done = 0, j;
    for (j = 0; j < total; j++) { if (boxes[j].checked) done++; }
    try { localStorage.setItem("mourshid-prog-" + PAGE, JSON.stringify({ done: done, total: total })); } catch (e) {}
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
  var SUBJ_NAMES = { fiqh: "الفقه", aqida: "العقيدة", tajwid: "التجويد", sira: "السيرة النبوية", hadith: "الحديث" };
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
          sub: sub, lesson: n, id: s.id, subjName: subjName,
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
      a.setAttribute("href", "#" + it.id);
      a.textContent = it.sec;
      var c = doc.createElement("span");
      c.className = "ctx";
      c.textContent = it.subjName + " · " + it.title + " — " + it.sec;
      a.appendChild(c);
      a.addEventListener("click", function (ev) {
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
    var items = Array.prototype.slice.call(quiz.querySelectorAll("details"));
    if (!items.length) return;
    var key = "mourshid-quiz-" + quiz.id;
    var st = { g: {}, at: 0 };
    try { var raw = JSON.parse(localStorage.getItem(key) || "null"); if (raw && raw.g) st = raw; } catch (e) {}
    function save() { try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {} }

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
