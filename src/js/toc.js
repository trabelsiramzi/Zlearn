
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
