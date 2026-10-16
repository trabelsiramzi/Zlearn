
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
