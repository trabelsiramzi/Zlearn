
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
