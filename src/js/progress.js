
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

    var statDone = doc.querySelector("[data-stat-done]"), statTotal = doc.querySelector("[data-stat-total]"), statPercent = doc.querySelector("[data-stat-percent]"), statFill = doc.querySelector(".stat-fill");
    var percent = total ? Math.round(done / total * 100) : 0;
    if (statDone) statDone.textContent = String(done);
    if (statTotal) statTotal.textContent = String(total);
    if (statPercent) statPercent.textContent = String(percent);
    if (statFill) statFill.style.width = percent + "%";

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
