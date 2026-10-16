
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
