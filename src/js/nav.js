
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
